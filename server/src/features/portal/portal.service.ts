import type { Parent } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { attendanceService } from '@/features/attendance/attendance.service';
import { invoicesService } from '@/features/invoices/invoices.service';
import { assignmentsForStudent, homeworkForStudent, resultsForStudent } from './portalData';
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
    // Ownership is already enforced above; the parent actor bypasses the
    // teacher-only section check in studentHistory.
    return attendanceService.studentHistory(
      parent.schoolId,
      { id: userId, role: 'PARENT' },
      studentId,
      query,
    );
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
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: parent.schoolId },
      select: { sectionId: true },
    });
    return homeworkForStudent(parent.schoolId, studentId, student?.sectionId ?? null);
  },

  async childAssignments(userId: string, studentId: string) {
    const { parent } = await getParentAndChild(userId, studentId);
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: parent.schoolId },
      select: { sectionId: true },
    });
    return assignmentsForStudent(parent.schoolId, studentId, student?.sectionId ?? null);
  },

  /** Published exam results for the child, computed per exam. */
  async childResults(userId: string, studentId: string) {
    const { parent } = await getParentAndChild(userId, studentId);
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: parent.schoolId },
      select: { classId: true },
    });
    return resultsForStudent(parent.schoolId, studentId, student?.classId ?? null);
  },
};
