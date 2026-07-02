import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { attendanceService } from '@/features/attendance/attendance.service';
import { invoicesService } from '@/features/invoices/invoices.service';
import {
  assignmentsForStudent,
  homeworkForStudent,
  resultsForStudent,
} from '@/features/portal/portalData';
import type { AttendanceQuery } from './studentPortal.validation';

/** Resolves the Student record for a logged-in STUDENT user (placement fields). */
const resolveStudent = async (userId: string) => {
  const student = await prisma.student.findFirst({
    where: { userId },
    select: { id: true, schoolId: true, sectionId: true, classId: true },
  });
  if (!student) throw ApiError.notFound('Student profile not found');
  return student;
};

export const studentPortalService = {
  /** The signed-in student's own profile + placement. */
  async me(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        status: true,
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
    if (!student) throw ApiError.notFound('Student profile not found');
    return student;
  },

  async attendance(userId: string, query: AttendanceQuery) {
    const student = await resolveStudent(userId);
    // The STUDENT actor is not a TEACHER, so it bypasses the section check in
    // studentHistory while remaining scoped to this student's own id.
    return attendanceService.studentHistory(
      student.schoolId,
      { id: userId, role: 'STUDENT' },
      student.id,
      query,
    );
  },

  async invoices(userId: string) {
    const student = await resolveStudent(userId);
    const { items } = await invoicesService.list(student.schoolId, {
      page: 1,
      limit: 50,
      sortOrder: 'desc',
      studentId: student.id,
    });
    return items;
  },

  async homework(userId: string) {
    const student = await resolveStudent(userId);
    return homeworkForStudent(student.schoolId, student.id, student.sectionId);
  },

  async assignments(userId: string) {
    const student = await resolveStudent(userId);
    return assignmentsForStudent(student.schoolId, student.id, student.sectionId);
  },

  async results(userId: string) {
    const student = await resolveStudent(userId);
    return resultsForStudent(student.schoolId, student.id, student.classId);
  },
};
