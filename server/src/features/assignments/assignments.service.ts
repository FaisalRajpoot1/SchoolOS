import { type Assignment, Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreateAssignmentInput,
  GradeSubmissionInput,
  ListAssignmentsQuery,
  RecordSubmissionInput,
  UpdateAssignmentInput,
} from './assignments.validation';

const detailInclude = {
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, firstName: true, lastName: true } },
  criteria: { orderBy: { sortOrder: 'asc' } },
  _count: { select: { submissions: true } },
} satisfies Prisma.AssignmentInclude;

const assertAssignment = async (schoolId: string, id: string): Promise<Assignment> => {
  const assignment = await prisma.assignment.findFirst({ where: { id, schoolId } });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  return assignment;
};

const resolveTeacherId = async (
  schoolId: string,
  userId: string,
  role: UserRole,
): Promise<string | null> => {
  if (role !== 'TEACHER') return null;
  const teacher = await prisma.teacher.findFirst({ where: { schoolId, userId }, select: { id: true } });
  return teacher?.id ?? null;
};

const assertSectionInClass = async (
  schoolId: string,
  classId: string,
  sectionId: string,
): Promise<void> => {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, classId, class: { schoolId } },
  });
  if (!section) throw ApiError.badRequest('Section does not belong to the selected class');
};

export const assignmentsService = {
  async create(
    schoolId: string,
    user: { id: string; role: UserRole },
    input: CreateAssignmentInput,
  ) {
    await assertSectionInClass(schoolId, input.classId, input.sectionId);
    if (input.subjectId) {
      const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
      if (!subject) throw ApiError.badRequest('Invalid subject for this school');
    }
    const teacherId = await resolveTeacherId(schoolId, user.id, user.role);

    return prisma.assignment.create({
      data: {
        schoolId,
        classId: input.classId,
        sectionId: input.sectionId,
        subjectId: input.subjectId ?? null,
        teacherId,
        title: input.title,
        description: input.description ?? null,
        instructions: input.instructions ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        maxMarks: input.maxMarks,
        dueDate: input.dueDate,
        criteria: input.criteria?.length
          ? {
              create: input.criteria.map((c, index) => ({
                label: c.label,
                maxPoints: c.maxPoints,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: detailInclude,
    });
  },

  async list(
    schoolId: string,
    query: ListAssignmentsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.AssignmentWhereInput = {
      schoolId,
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.assignment.findMany({
        where,
        skip,
        take,
        orderBy: { dueDate: query.sortOrder },
        include: detailInclude,
      }),
      prisma.assignment.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, schoolId },
      include: detailInclude,
    });
    if (!assignment) throw ApiError.notFound('Assignment not found');
    return assignment;
  },

  async update(schoolId: string, id: string, input: UpdateAssignmentInput) {
    await assertAssignment(schoolId, id);
    if (input.subjectId) {
      const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } });
      if (!subject) throw ApiError.badRequest('Invalid subject for this school');
    }
    await prisma.assignment.update({ where: { id }, data: input });
    return this.getById(schoolId, id);
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertAssignment(schoolId, id);
    await prisma.assignment.delete({ where: { id } });
  },

  // ---- Submissions ----
  async submissionsRoster(schoolId: string, assignmentId: string) {
    const assignment = await assertAssignment(schoolId, assignmentId);
    const [students, submissions] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, sectionId: assignment.sectionId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.assignmentSubmission.findMany({ where: { assignmentId } }),
    ]);

    const byStudent = new Map(submissions.map((s) => [s.studentId, s]));
    return {
      maxMarks: assignment.maxMarks,
      dueDate: assignment.dueDate,
      entries: students.map((student) => ({
        student,
        submission: byStudent.get(student.id) ?? null,
      })),
    };
  },

  async recordSubmission(
    schoolId: string,
    assignmentId: string,
    studentId: string,
    input: RecordSubmissionInput,
  ) {
    const assignment = await assertAssignment(schoolId, assignmentId);
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId, sectionId: assignment.sectionId },
      select: { id: true },
    });
    if (!student) throw ApiError.badRequest('Student is not in this assignment section');

    const submittedAt = input.submittedAt ?? new Date();
    const isLate = submittedAt.getTime() > assignment.dueDate.getTime();

    await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: {
        content: input.content ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        submittedAt,
        isLate,
      },
      create: {
        assignmentId,
        studentId,
        content: input.content ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        submittedAt,
        isLate,
      },
    });

    return this.submissionsRoster(schoolId, assignmentId);
  },

  async gradeSubmission(
    schoolId: string,
    assignmentId: string,
    studentId: string,
    input: GradeSubmissionInput,
  ) {
    const assignment = await assertAssignment(schoolId, assignmentId);
    if (input.marks != null && input.marks > assignment.maxMarks) {
      throw ApiError.badRequest(`Marks cannot exceed the maximum of ${assignment.maxMarks}`);
    }
    const submission = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, studentId },
    });
    if (!submission) throw ApiError.badRequest('No submission to grade for this student');

    await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: { marks: input.marks ?? null, feedback: input.feedback ?? null, gradedAt: new Date() },
    });

    return this.submissionsRoster(schoolId, assignmentId);
  },

  async removeSubmission(schoolId: string, assignmentId: string, studentId: string) {
    await assertAssignment(schoolId, assignmentId);
    await prisma.assignmentSubmission.deleteMany({ where: { assignmentId, studentId } });
    return this.submissionsRoster(schoolId, assignmentId);
  },
};
