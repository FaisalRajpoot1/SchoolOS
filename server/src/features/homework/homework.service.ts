import { type Homework, Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreateHomeworkInput,
  GradeSubmissionInput,
  ListHomeworkQuery,
  RecordSubmissionInput,
  UpdateHomeworkInput,
} from './homework.validation';

const detailInclude = {
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { submissions: true } },
} satisfies Prisma.HomeworkInclude;

const assertHomework = async (schoolId: string, id: string): Promise<Homework> => {
  const homework = await prisma.homework.findFirst({ where: { id, schoolId } });
  if (!homework) throw ApiError.notFound('Homework not found');
  return homework;
};

/** Resolves the Teacher record id for a TEACHER user (used as the author). */
const resolveTeacherId = async (
  schoolId: string,
  userId: string,
  role: UserRole,
): Promise<string | null> => {
  if (role !== 'TEACHER') return null;
  const teacher = await prisma.teacher.findFirst({ where: { schoolId, userId }, select: { id: true } });
  return teacher?.id ?? null;
};

/** Validates a section belongs to the given class within the tenant. */
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

const assertSubject = async (schoolId: string, subjectId: string): Promise<void> => {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) throw ApiError.badRequest('Invalid subject for this school');
};

export const homeworkService = {
  async create(
    schoolId: string,
    user: { id: string; role: UserRole },
    input: CreateHomeworkInput,
  ) {
    await assertSectionInClass(schoolId, input.classId, input.sectionId);
    if (input.subjectId) await assertSubject(schoolId, input.subjectId);
    const teacherId = await resolveTeacherId(schoolId, user.id, user.role);

    const homework = await prisma.homework.create({
      data: {
        schoolId,
        classId: input.classId,
        sectionId: input.sectionId,
        subjectId: input.subjectId ?? null,
        teacherId,
        title: input.title,
        description: input.description ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        dueDate: input.dueDate,
      },
      include: detailInclude,
    });
    return homework;
  },

  async list(
    schoolId: string,
    query: ListHomeworkQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.HomeworkWhereInput = {
      schoolId,
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.homework.findMany({
        where,
        skip,
        take,
        orderBy: { dueDate: query.sortOrder },
        include: detailInclude,
      }),
      prisma.homework.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const homework = await prisma.homework.findFirst({ where: { id, schoolId }, include: detailInclude });
    if (!homework) throw ApiError.notFound('Homework not found');
    return homework;
  },

  async update(schoolId: string, id: string, input: UpdateHomeworkInput) {
    await assertHomework(schoolId, id);
    if (input.subjectId) await assertSubject(schoolId, input.subjectId);
    await prisma.homework.update({ where: { id }, data: input });
    return this.getById(schoolId, id);
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertHomework(schoolId, id);
    await prisma.homework.delete({ where: { id } });
  },

  // ---- Submissions ----
  /** Section roster with each student's submission (or null). */
  async submissionsRoster(schoolId: string, homeworkId: string) {
    const homework = await assertHomework(schoolId, homeworkId);

    const [students, submissions] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, sectionId: homework.sectionId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.homeworkSubmission.findMany({ where: { homeworkId } }),
    ]);

    const byStudent = new Map(submissions.map((s) => [s.studentId, s]));
    return {
      dueDate: homework.dueDate,
      entries: students.map((student) => ({
        student,
        submission: byStudent.get(student.id) ?? null,
      })),
    };
  },

  async recordSubmission(
    schoolId: string,
    homeworkId: string,
    studentId: string,
    input: RecordSubmissionInput,
  ) {
    const homework = await assertHomework(schoolId, homeworkId);
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId, sectionId: homework.sectionId },
      select: { id: true },
    });
    if (!student) throw ApiError.badRequest('Student is not in this homework section');

    const submittedAt = input.submittedAt ?? new Date();
    const isLate = submittedAt.getTime() > homework.dueDate.getTime();

    await prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId, studentId } },
      update: {
        content: input.content ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        submittedAt,
        isLate,
      },
      create: {
        homeworkId,
        studentId,
        content: input.content ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        submittedAt,
        isLate,
      },
    });

    return this.submissionsRoster(schoolId, homeworkId);
  },

  async gradeSubmission(
    schoolId: string,
    homeworkId: string,
    studentId: string,
    input: GradeSubmissionInput,
  ) {
    await assertHomework(schoolId, homeworkId);
    const submission = await prisma.homeworkSubmission.findFirst({
      where: { homeworkId, studentId },
    });
    if (!submission) throw ApiError.badRequest('No submission to grade for this student');

    await prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: {
        feedback: input.feedback ?? null,
        marks: input.marks ?? null,
        gradedAt: new Date(),
      },
    });

    return this.submissionsRoster(schoolId, homeworkId);
  },

  async removeSubmission(schoolId: string, homeworkId: string, studentId: string) {
    await assertHomework(schoolId, homeworkId);
    await prisma.homeworkSubmission.deleteMany({ where: { homeworkId, studentId } });
    return this.submissionsRoster(schoolId, homeworkId);
  },
};
