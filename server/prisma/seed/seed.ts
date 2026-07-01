import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'ChangeMe123!';

/** Idempotent seed: platform super admin + a demo school with admin and academic year. */
async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Platform owner (no tenant). Composite-unique lookups can't use a null
  // schoolId, so guard with findFirst.
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, email: 'owner@schoolos.dev' },
  });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: 'owner@schoolos.dev',
        passwordHash,
        firstName: 'Platform',
        lastName: 'Owner',
        role: UserRole.SUPER_ADMIN,
        schoolId: null,
      },
    });
  }

  // Demo tenant.
  const school = await prisma.school.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      slug: 'demo-school',
      email: 'admin@demo.school',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    },
  });

  await prisma.user.upsert({
    where: { schoolId_email: { schoolId: school.id, email: 'admin@demo.school' } },
    update: {},
    create: {
      email: 'admin@demo.school',
      passwordHash,
      firstName: 'School',
      lastName: 'Admin',
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school.id,
    },
  });

  await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: '2025-2026' } },
    update: {},
    create: {
      schoolId: school.id,
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
    },
  });

  // Subject catalog.
  const subjectSeeds = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
  ];
  const subjects = await Promise.all(
    subjectSeeds.map((s) =>
      prisma.subject.upsert({
        where: { schoolId_code: { schoolId: school.id, code: s.code } },
        update: {},
        create: { schoolId: school.id, name: s.name, code: s.code },
      }),
    ),
  );

  // A class with two sections, offering every subject.
  const grade1 = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 1' } },
    update: {},
    create: { schoolId: school.id, name: 'Grade 1', level: 1 },
  });

  for (const name of ['A', 'B']) {
    await prisma.section.upsert({
      where: { classId_name: { classId: grade1.id, name } },
      update: {},
      create: { classId: grade1.id, name, capacity: 30 },
    });
  }

  await prisma.classSubject.createMany({
    data: subjects.map((subject) => ({ classId: grade1.id, subjectId: subject.id })),
    skipDuplicates: true,
  });

  // A demo teacher with a login account, set as class teacher of Grade 1/A
  // and subject teacher of Mathematics.
  const sectionA = await prisma.section.findUnique({
    where: { classId_name: { classId: grade1.id, name: 'A' } },
  });

  const existingTeacher = await prisma.teacher.findUnique({
    where: { schoolId_employeeNo: { schoolId: school.id, employeeNo: 'EMP-00001' } },
  });
  if (!existingTeacher) {
    const teacherUser = await prisma.user.create({
      data: {
        email: 'teacher@demo.school',
        passwordHash,
        firstName: 'Tariq',
        lastName: 'Mehmood',
        role: UserRole.TEACHER,
        schoolId: school.id,
      },
    });
    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        userId: teacherUser.id,
        employeeNo: 'EMP-00001',
        firstName: 'Tariq',
        lastName: 'Mehmood',
        email: 'teacher@demo.school',
        qualification: 'M.Sc. Mathematics',
        experienceYears: 6,
      },
    });

    if (sectionA) {
      await prisma.section.update({
        where: { id: sectionA.id },
        data: { classTeacherId: teacher.id },
      });
    }
    const mathSubject = subjects.find((s) => s.code === 'MATH');
    if (mathSubject) {
      await prisma.classSubject.update({
        where: { classId_subjectId: { classId: grade1.id, subjectId: mathSubject.id } },
        data: { teacherId: teacher.id },
      });
    }
  }

  const studentSeeds = [
    { admissionNo: 'ADM-00001', firstName: 'Ayesha', lastName: 'Khan', guardian: 'Imran Khan' },
    { admissionNo: 'ADM-00002', firstName: 'Bilal', lastName: 'Ahmed', guardian: 'Sara Ahmed' },
  ];

  for (const seed of studentSeeds) {
    const [guardianFirst, guardianLast] = seed.guardian.split(' ');
    await prisma.student.upsert({
      where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: seed.admissionNo } },
      update: {},
      create: {
        schoolId: school.id,
        admissionNo: seed.admissionNo,
        firstName: seed.firstName,
        lastName: seed.lastName,
        classId: grade1.id,
        sectionId: sectionA?.id ?? null,
        guardians: {
          create: {
            relation: 'Parent',
            firstName: guardianFirst ?? 'Parent',
            lastName: guardianLast ?? seed.lastName,
            isPrimary: true,
          },
        },
      },
    });
  }

  // Sample attendance for Grade 1/A on a fixed day.
  if (sectionA) {
    const day = new Date('2026-06-29');
    const sectionStudents = await prisma.student.findMany({
      where: { schoolId: school.id, sectionId: sectionA.id },
      select: { id: true },
    });
    const statuses = ['PRESENT', 'ABSENT'] as const;
    for (const [index, student] of sectionStudents.entries()) {
      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: student.id, date: day } },
        update: {},
        create: {
          schoolId: school.id,
          studentId: student.id,
          sectionId: sectionA.id,
          date: day,
          status: statuses[index % statuses.length],
        },
      });
    }
  }

  // Fee categories + a demo invoice with a partial payment for the first student.
  const tuition = await prisma.feeCategory.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Tuition' } },
    update: {},
    create: { schoolId: school.id, name: 'Tuition', description: 'Monthly tuition fee' },
  });
  await prisma.feeCategory.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Transport' } },
    update: {},
    create: { schoolId: school.id, name: 'Transport' },
  });

  const firstStudent = await prisma.student.findUnique({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'ADM-00001' } },
  });
  if (firstStudent) {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { schoolId_invoiceNo: { schoolId: school.id, invoiceNo: 'INV-00001' } },
    });
    if (!existingInvoice) {
      await prisma.invoice.create({
        data: {
          schoolId: school.id,
          studentId: firstStudent.id,
          invoiceNo: 'INV-00001',
          title: 'Term 1 Fees',
          status: 'PARTIAL',
          total: 20000,
          items: {
            create: [
              { categoryId: tuition.id, description: 'Tuition — Term 1', amount: 15000, quantity: 1 },
              { description: 'Admission fee', amount: 5000, quantity: 1 },
            ],
          },
          payments: {
            create: { schoolId: school.id, amount: 10000, method: 'CASH' },
          },
        },
      });
    }
  }

  // A demo published exam with marks for Grade 1.
  const existingExam = await prisma.exam.findFirst({
    where: { schoolId: school.id, name: 'Mid-Term', classId: grade1.id },
  });
  if (!existingExam) {
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        name: 'Mid-Term',
        classId: grade1.id,
        status: 'PUBLISHED',
        examSubjects: {
          create: subjects.map((s) => ({ subjectId: s.id, maxMarks: 100, passMarks: 40 })),
        },
      },
      include: { examSubjects: true },
    });

    const gradeStudents = await prisma.student.findMany({
      where: { schoolId: school.id, classId: grade1.id },
      select: { id: true },
    });
    const baseScores = [85, 72, 60];
    for (const [si, es] of exam.examSubjects.entries()) {
      for (const [pi, student] of gradeStudents.entries()) {
        await prisma.mark.upsert({
          where: { examSubjectId_studentId: { examSubjectId: es.id, studentId: student.id } },
          update: {},
          create: {
            examSubjectId: es.id,
            studentId: student.id,
            marksObtained: Math.max(35, (baseScores[si] ?? 70) - pi * 10),
          },
        });
      }
    }
  }

  // A demo homework for Grade 1 / Section A with one submission.
  if (sectionA) {
    const mathSubject = subjects.find((s) => s.code === 'MATH');
    const hwTeacher = await prisma.teacher.findUnique({
      where: { schoolId_employeeNo: { schoolId: school.id, employeeNo: 'EMP-00001' } },
    });
    const existingHomework = await prisma.homework.findFirst({
      where: { schoolId: school.id, sectionId: sectionA.id, title: 'Algebra Worksheet 1' },
    });
    if (!existingHomework) {
      const homework = await prisma.homework.create({
        data: {
          schoolId: school.id,
          classId: grade1.id,
          sectionId: sectionA.id,
          subjectId: mathSubject?.id ?? null,
          teacherId: hwTeacher?.id ?? null,
          title: 'Algebra Worksheet 1',
          description: 'Complete questions 1–10 from chapter 3.',
          dueDate: new Date('2026-07-05'),
        },
      });
      const secStudents = await prisma.student.findMany({
        where: { schoolId: school.id, sectionId: sectionA.id },
        select: { id: true },
      });
      if (secStudents[0]) {
        await prisma.homeworkSubmission.upsert({
          where: { homeworkId_studentId: { homeworkId: homework.id, studentId: secStudents[0].id } },
          update: {},
          create: {
            homeworkId: homework.id,
            studentId: secStudents[0].id,
            content: 'Submitted, all questions attempted.',
            submittedAt: new Date('2026-07-04'),
            isLate: false,
          },
        });
      }
    }
  }

  // A demo assignment (with rubric) for Grade 1 / Section A and a graded submission.
  if (sectionA) {
    const mathSubject = subjects.find((s) => s.code === 'MATH');
    const asgTeacher = await prisma.teacher.findUnique({
      where: { schoolId_employeeNo: { schoolId: school.id, employeeNo: 'EMP-00001' } },
    });
    const existingAssignment = await prisma.assignment.findFirst({
      where: { schoolId: school.id, sectionId: sectionA.id, title: 'Geometry Model Project' },
    });
    if (!existingAssignment) {
      const assignment = await prisma.assignment.create({
        data: {
          schoolId: school.id,
          classId: grade1.id,
          sectionId: sectionA.id,
          subjectId: mathSubject?.id ?? null,
          teacherId: asgTeacher?.id ?? null,
          title: 'Geometry Model Project',
          description: 'Build a 3D model demonstrating basic shapes.',
          maxMarks: 50,
          dueDate: new Date('2026-07-10'),
          criteria: {
            create: [
              { label: 'Accuracy', maxPoints: 25, sortOrder: 0 },
              { label: 'Presentation', maxPoints: 25, sortOrder: 1 },
            ],
          },
        },
      });
      const secStudents = await prisma.student.findMany({
        where: { schoolId: school.id, sectionId: sectionA.id },
        select: { id: true },
      });
      if (secStudents[0]) {
        await prisma.assignmentSubmission.upsert({
          where: {
            assignmentId_studentId: { assignmentId: assignment.id, studentId: secStudents[0].id },
          },
          update: {},
          create: {
            assignmentId: assignment.id,
            studentId: secStudents[0].id,
            content: 'Model submitted.',
            submittedAt: new Date('2026-07-09'),
            isLate: false,
            marks: 42,
            gradedAt: new Date('2026-07-11'),
          },
        });
      }
    }
  }

  // A demo parent account linked to the seeded students.
  const existingParentUser = await prisma.user.findFirst({
    where: { schoolId: school.id, email: 'parent@demo.school' },
  });
  if (!existingParentUser) {
    const allStudents = await prisma.student.findMany({
      where: { schoolId: school.id },
      select: { id: true },
    });
    const parentUser = await prisma.user.create({
      data: {
        email: 'parent@demo.school',
        passwordHash,
        firstName: 'Imran',
        lastName: 'Khan',
        role: UserRole.PARENT,
        schoolId: school.id,
      },
    });
    await prisma.parent.create({
      data: {
        schoolId: school.id,
        userId: parentUser.id,
        firstName: 'Imran',
        lastName: 'Khan',
        email: 'parent@demo.school',
        children: { create: allStudents.map((s) => ({ studentId: s.id, relation: 'Father' })) },
      },
    });
  }

  // A couple of Monday timetable slots for Grade 1 / Section A.
  if (sectionA) {
    const mathSubject = subjects.find((s) => s.code === 'MATH');
    const engSubject = subjects.find((s) => s.code === 'ENG');
    const ttTeacher = await prisma.teacher.findUnique({
      where: { schoolId_employeeNo: { schoolId: school.id, employeeNo: 'EMP-00001' } },
    });
    const existingSlot = await prisma.timetableSlot.findFirst({
      where: { schoolId: school.id, sectionId: sectionA.id },
    });
    if (!existingSlot) {
      await prisma.timetableSlot.createMany({
        data: [
          {
            schoolId: school.id,
            sectionId: sectionA.id,
            dayOfWeek: 'MON',
            startMinute: 480,
            endMinute: 525,
            subjectId: mathSubject?.id ?? null,
            teacherId: ttTeacher?.id ?? null,
            room: '101',
          },
          {
            schoolId: school.id,
            sectionId: sectionA.id,
            dayOfWeek: 'MON',
            startMinute: 525,
            endMinute: 570,
            subjectId: engSubject?.id ?? null,
            room: '101',
          },
        ],
      });
    }
  }

  // A librarian account + a small book catalog with one active issue.
  const existingLibrarian = await prisma.user.findFirst({
    where: { schoolId: school.id, email: 'librarian@demo.school' },
  });
  if (!existingLibrarian) {
    await prisma.user.create({
      data: {
        email: 'librarian@demo.school',
        passwordHash,
        firstName: 'Nadia',
        lastName: 'Sheikh',
        role: UserRole.LIBRARIAN,
        schoolId: school.id,
      },
    });
  }

  const fiction = await prisma.bookCategory.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Fiction' } },
    update: {},
    create: { schoolId: school.id, name: 'Fiction' },
  });

  const firstBook = await prisma.book.findFirst({
    where: { schoolId: school.id, title: 'The Little Prince' },
  });
  if (!firstBook) {
    const book = await prisma.book.create({
      data: {
        schoolId: school.id,
        title: 'The Little Prince',
        author: 'Antoine de Saint-Exupéry',
        isbn: '9780156012195',
        categoryId: fiction.id,
        totalCopies: 3,
        availableCopies: 3,
      },
    });
    const borrower = await prisma.student.findUnique({
      where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'ADM-00001' } },
    });
    if (borrower) {
      await prisma.bookIssue.create({
        data: {
          schoolId: school.id,
          bookId: book.id,
          studentId: borrower.id,
          dueDate: new Date('2026-07-20'),
        },
      });
      await prisma.book.update({
        where: { id: book.id },
        data: { availableCopies: { decrement: 1 } },
      });
    }
  }

  // A demo transport vehicle, route with stops, and one student allocation.
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { schoolId_registrationNo: { schoolId: school.id, registrationNo: 'BUS-01' } },
  });
  if (!existingVehicle) {
    const vehicle = await prisma.vehicle.create({
      data: {
        schoolId: school.id,
        registrationNo: 'BUS-01',
        model: 'Toyota Coaster',
        capacity: 30,
        driverName: 'Rashid Ali',
        driverPhone: '0300-1234567',
      },
    });
    const route = await prisma.transportRoute.create({
      data: {
        schoolId: school.id,
        name: 'North Route',
        fee: 2000,
        vehicleId: vehicle.id,
        stops: {
          create: [
            { name: 'Main Gate', sequence: 1, pickupMinute: 435 },
            { name: 'City Center', sequence: 2, pickupMinute: 450 },
          ],
        },
      },
      include: { stops: true },
    });
    const rider = await prisma.student.findUnique({
      where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'ADM-00002' } },
    });
    if (rider) {
      await prisma.transportAllocation.upsert({
        where: { studentId: rider.id },
        update: {},
        create: {
          schoolId: school.id,
          studentId: rider.id,
          routeId: route.id,
          stopId: route.stops[0]?.id ?? null,
        },
      });
    }
  }

  // A couple of notice-board announcements.
  const adminUser = await prisma.user.findFirst({
    where: { schoolId: school.id, email: 'admin@demo.school' },
    select: { id: true },
  });
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { schoolId: school.id },
  });
  if (!existingAnnouncement) {
    await prisma.announcement.createMany({
      data: [
        {
          schoolId: school.id,
          authorId: adminUser?.id ?? null,
          title: 'Welcome to the new term',
          body: 'Classes resume Monday. Please review your timetable and fee dues.',
          audience: 'ALL',
          pinned: true,
        },
        {
          schoolId: school.id,
          authorId: adminUser?.id ?? null,
          title: 'Parent-teacher meeting',
          body: 'A PTM is scheduled for next Friday at 10:00 AM in the main hall.',
          audience: 'PARENTS',
        },
      ],
    });
  }

  // A demo hostel with a room and one allocated boarder.
  const existingHostel = await prisma.hostel.findFirst({
    where: { schoolId: school.id, name: 'Boys Hostel A' },
  });
  if (!existingHostel) {
    const hostel = await prisma.hostel.create({
      data: {
        schoolId: school.id,
        name: 'Boys Hostel A',
        type: 'BOYS',
        wardenName: 'Kamran Malik',
        monthlyFee: 5000,
        rooms: { create: [{ roomNumber: '101', floor: '1', capacity: 2 }] },
      },
      include: { rooms: true },
    });
    const boarder = await prisma.student.findUnique({
      where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'ADM-00002' } },
    });
    const room = hostel.rooms[0];
    if (boarder && room) {
      await prisma.hostelAllocation.upsert({
        where: { studentId: boarder.id },
        update: {},
        create: { schoolId: school.id, studentId: boarder.id, roomId: room.id, bedLabel: 'A' },
      });
    }
  }

  // A demo supplier and a couple of inventory items with opening stock.
  const existingSupplier = await prisma.supplier.findFirst({
    where: { schoolId: school.id, name: 'Stationery House' },
  });
  if (!existingSupplier) {
    const supplier = await prisma.supplier.create({
      data: {
        schoolId: school.id,
        name: 'Stationery House',
        contactPerson: 'Ahmed Raza',
        phone: '0311-2223344',
      },
    });
    const itemSeeds = [
      { name: 'A4 Paper Ream', category: 'Stationery', unit: 'ream', quantity: 50, reorderLevel: 10 },
      { name: 'Whiteboard Marker', category: 'Stationery', unit: 'piece', quantity: 8, reorderLevel: 20 },
    ];
    for (const seed of itemSeeds) {
      await prisma.inventoryItem.create({
        data: {
          schoolId: school.id,
          supplierId: supplier.id,
          name: seed.name,
          category: seed.category,
          unit: seed.unit,
          quantity: seed.quantity,
          reorderLevel: seed.reorderLevel,
          transactions: {
            create: { schoolId: school.id, type: 'IN', quantity: seed.quantity, note: 'Opening stock' },
          },
        },
      });
    }
  }

  // An HR login account + a demo employee with a pending leave request.
  const existingHr = await prisma.user.findFirst({
    where: { schoolId: school.id, email: 'hr@demo.school' },
  });
  if (!existingHr) {
    await prisma.user.create({
      data: {
        email: 'hr@demo.school',
        passwordHash,
        firstName: 'Hina',
        lastName: 'Farooq',
        role: UserRole.HR,
        schoolId: school.id,
      },
    });
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: { schoolId: school.id, employeeCode: 'STF-00001' },
  });
  if (!existingEmployee) {
    const employee = await prisma.employee.create({
      data: {
        schoolId: school.id,
        employeeCode: 'STF-00001',
        firstName: 'Junaid',
        lastName: 'Iqbal',
        designation: 'Accountant',
        department: 'Finance',
        employmentType: 'FULL_TIME',
        salary: 60000,
      },
    });
    await prisma.leaveRequest.create({
      data: {
        schoolId: school.id,
        employeeId: employee.id,
        type: 'CASUAL',
        startDate: new Date('2026-07-15'),
        endDate: new Date('2026-07-16'),
        reason: 'Family event',
      },
    });

    // A demo payslip for June 2026.
    await prisma.payslip.upsert({
      where: {
        employeeId_periodYear_periodMonth: {
          employeeId: employee.id,
          periodYear: 2026,
          periodMonth: 6,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        employeeId: employee.id,
        periodMonth: 6,
        periodYear: 2026,
        basicSalary: 60000,
        allowances: 5000,
        tax: 3000,
        netPay: 62000,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete');
  // eslint-disable-next-line no-console
  console.table({
    superAdmin: { email: 'owner@schoolos.dev', password: DEMO_PASSWORD, schoolId: '(none)' },
    schoolAdmin: { email: 'admin@demo.school', password: DEMO_PASSWORD, schoolId: school.id },
    teacher: { email: 'teacher@demo.school', password: DEMO_PASSWORD, schoolId: school.id },
    parent: { email: 'parent@demo.school', password: DEMO_PASSWORD, schoolId: school.id },
    librarian: { email: 'librarian@demo.school', password: DEMO_PASSWORD, schoolId: school.id },
    hr: { email: 'hr@demo.school', password: DEMO_PASSWORD, schoolId: school.id },
  });
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
