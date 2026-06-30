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

  // A couple of enrolled students in Grade 1 / Section A, each with a guardian.
  const sectionA = await prisma.section.findUnique({
    where: { classId_name: { classId: grade1.id, name: 'A' } },
  });

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

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete');
  // eslint-disable-next-line no-console
  console.table({
    superAdmin: { email: 'owner@schoolos.dev', password: DEMO_PASSWORD, schoolId: '(none)' },
    schoolAdmin: { email: 'admin@demo.school', password: DEMO_PASSWORD, schoolId: school.id },
  });
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
