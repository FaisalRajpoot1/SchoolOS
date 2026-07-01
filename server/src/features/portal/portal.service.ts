import type { Parent } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { attendanceService } from '@/features/attendance/attendance.service';
import { invoicesService } from '@/features/invoices/invoices.service';
import { gradeForPercentage } from '@/features/exams/grade';
import type { AttendanceQuery } from './portal.validation';

/** Resolves the Parent record for a logged-in PARENT user. */
const getParent = async (userId: string): Promise<Parent> => {
  const parent = await prisma.parent.findFirst({ where: { userId } });
  if (!parent) throw ApiError.notFound('Parent profile not found');
  return parent;
};

/** Resolves the parent and verifies the student is one of their children. */
const getParentAndChild = async (
  userId: string,
  studentId: string,
): Promise<{ parent: Parent }> => {
  const parent = await getParent(userId);
  const link = await prisma.parentStudent.findFirst({ where: { parentId: parent.id, studentId } });
  if (!link) throw ApiError.forbidden('This student is not linked to your account');
  return { parent };
};

export const portalService = {
  /** Parent profile plus the list of their children. */
  async me(userId: string) {
    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        children: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNo: true,
                status: true,
                class: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!parent) throw ApiError.notFound('Parent profile not found');

    return {
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
      },
      children: parent.children.map((c) => ({ relation: c.relation, ...c.student })),
    };
  },

  async childAttendance(userId: string, studentId: string, query: AttendanceQuery) {
    const { parent } = await getParentAndChild(userId, studentId);
    return attendanceService.studentHistory(parent.schoolId, studentId, query);
  },

  async childInvoices(userId: string, studentId: string) {
    const { parent } = await getParentAndChild(userId, studentId);
    const { items } = await invoicesService.list(parent.schoolId, {
      page: 1,
      limit: 50,
      sortOrder: 'desc',
      studentId,
    });
    return items;
  },

  async childHomework(userId: string, studentId: string) {
    const { parent } = await getParentAndChild(userId, studentId);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { sectionId: true },
    });
    if (!student?.sectionId) return [];

    const homeworks = await prisma.homework.findMany({
      where: { schoolId: parent.schoolId, sectionId: student.sectionId },
      orderBy: { dueDate: 'desc' },
      include: {
        subject: { select: { id: true, name: true } },
        submissions: {
          where: { studentId },
          select: { submittedAt: true, isLate: true, marks: true, feedback: true, gradedAt: true },
        },
      },
    });

    return homeworks.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      dueDate: h.dueDate,
      subject: h.subject,
      submission: h.submissions[0] ?? null,
    }));
  },

  async childAssignments(userId: string, studentId: string) {
    const { parent } = await getParentAndChild(userId, studentId);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { sectionId: true },
    });
    if (!student?.sectionId) return [];

    const assignments = await prisma.assignment.findMany({
      where: { schoolId: parent.schoolId, sectionId: student.sectionId },
      orderBy: { dueDate: 'desc' },
      include: {
        subject: { select: { id: true, name: true } },
        submissions: {
          where: { studentId },
          select: { submittedAt: true, isLate: true, marks: true, feedback: true, gradedAt: true },
        },
      },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate,
      maxMarks: a.maxMarks,
      subject: a.subject,
      submission: a.submissions[0] ?? null,
    }));
  },

  /** Published exam results for the child, computed per exam. */
  async childResults(userId: string, studentId: string) {
    const { parent } = await getParentAndChild(userId, studentId);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });
    if (!student?.classId) return [];

    const exams = await prisma.exam.findMany({
      where: { schoolId: parent.schoolId, classId: student.classId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        examSubjects: {
          select: {
            maxMarks: true,
            passMarks: true,
            subject: { select: { id: true, name: true } },
            marks: { where: { studentId }, select: { marksObtained: true, isAbsent: true } },
          },
        },
      },
    });

    return exams.map((exam) => {
      let obtained = 0;
      let totalMax = 0;
      let failed = false;
      const subjects = exam.examSubjects.map((es) => {
        totalMax += es.maxMarks;
        const mark = es.marks[0];
        const score = mark && !mark.isAbsent ? (mark.marksObtained ?? 0) : 0;
        obtained += score;
        const passed = !!mark && !mark.isAbsent && score >= es.passMarks;
        if (!passed) failed = true;
        return {
          subject: es.subject,
          maxMarks: es.maxMarks,
          marksObtained: mark && !mark.isAbsent ? mark.marksObtained : null,
          isAbsent: mark?.isAbsent ?? false,
          passed,
        };
      });
      const percentage = totalMax > 0 ? Math.round((obtained / totalMax) * 10000) / 100 : 0;
      return {
        examId: exam.id,
        examName: exam.name,
        obtained,
        totalMax,
        percentage,
        grade: gradeForPercentage(percentage),
        passed: !failed && subjects.length > 0,
        subjects,
      };
    });
  },
};
