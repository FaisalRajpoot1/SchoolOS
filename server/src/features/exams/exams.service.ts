import { type Exam, type ExamSubject, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { gradeForPercentage } from './grade';
import type {
  BulkMarksInput,
  CreateExamInput,
  ListExamsQuery,
  UpdateExamInput,
  UpdateExamSubjectInput,
} from './exams.validation';

const detailInclude = {
  class: { select: { id: true, name: true } },
  academicYear: { select: { id: true, name: true } },
  examSubjects: {
    include: {
      subject: { select: { id: true, name: true, code: true } },
      _count: { select: { marks: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  },
} satisfies Prisma.ExamInclude;

const assertExam = async (schoolId: string, examId: string): Promise<Exam> => {
  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId } });
  if (!exam) throw ApiError.notFound('Exam not found');
  return exam;
};

const assertExamSubject = async (
  schoolId: string,
  examId: string,
  examSubjectId: string,
): Promise<ExamSubject> => {
  const examSubject = await prisma.examSubject.findFirst({
    where: { id: examSubjectId, examId, exam: { schoolId } },
  });
  if (!examSubject) throw ApiError.notFound('Exam subject not found');
  return examSubject;
};

export const examsService = {
  /** Creates an exam and auto-populates its subjects from the class's offered subjects. */
  async create(schoolId: string, input: CreateExamInput) {
    const klass = await prisma.class.findFirst({
      where: { id: input.classId, schoolId },
      include: { classSubjects: { select: { subjectId: true } } },
    });
    if (!klass) throw ApiError.badRequest('Invalid class for this school');

    if (input.academicYearId) {
      const year = await prisma.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId },
      });
      if (!year) throw ApiError.badRequest('Invalid academic year');
    }

    const exam = await prisma.exam.create({
      data: {
        schoolId,
        name: input.name,
        classId: input.classId,
        academicYearId: input.academicYearId ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        examSubjects: {
          create: klass.classSubjects.map((cs) => ({ subjectId: cs.subjectId })),
        },
      },
      include: detailInclude,
    });
    return exam;
  },

  async list(
    schoolId: string,
    query: ListExamsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.ExamWhereInput = {
      schoolId,
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: {
          class: { select: { id: true, name: true } },
          _count: { select: { examSubjects: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const exam = await prisma.exam.findFirst({ where: { id, schoolId }, include: detailInclude });
    if (!exam) throw ApiError.notFound('Exam not found');
    return exam;
  },

  async update(schoolId: string, id: string, input: UpdateExamInput) {
    await assertExam(schoolId, id);
    await prisma.exam.update({ where: { id }, data: input });
    return this.getById(schoolId, id);
  },

  async setPublished(schoolId: string, id: string, published: boolean) {
    await assertExam(schoolId, id);
    await prisma.exam.update({
      where: { id },
      data: { status: published ? 'PUBLISHED' : 'DRAFT' },
    });
    return this.getById(schoolId, id);
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertExam(schoolId, id);
    await prisma.exam.delete({ where: { id } });
  },

  // ---- Exam subjects (marking scheme) ----
  async updateExamSubject(
    schoolId: string,
    examId: string,
    examSubjectId: string,
    input: UpdateExamSubjectInput,
  ) {
    const existing = await assertExamSubject(schoolId, examId, examSubjectId);
    const maxMarks = input.maxMarks ?? existing.maxMarks;
    const passMarks = input.passMarks ?? existing.passMarks;
    if (passMarks > maxMarks) {
      throw ApiError.badRequest('Pass marks cannot exceed max marks');
    }
    return prisma.examSubject.update({ where: { id: examSubjectId }, data: input });
  },

  // ---- Marks ----
  /** Roster of the exam's class students with their mark for one subject. */
  async marksRoster(schoolId: string, examId: string, examSubjectId: string) {
    const exam = await assertExam(schoolId, examId);
    const examSubject = await assertExamSubject(schoolId, examId, examSubjectId);

    const [students, marks] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, classId: exam.classId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.mark.findMany({
        where: { examSubjectId },
        select: { studentId: true, marksObtained: true, isAbsent: true, remark: true },
      }),
    ]);

    const byStudent = new Map(marks.map((m) => [m.studentId, m]));
    return {
      maxMarks: examSubject.maxMarks,
      passMarks: examSubject.passMarks,
      entries: students.map((student) => {
        const mark = byStudent.get(student.id);
        return {
          student,
          marksObtained: mark?.marksObtained ?? null,
          isAbsent: mark?.isAbsent ?? false,
          remark: mark?.remark ?? null,
        };
      }),
    };
  },

  async bulkMarks(
    schoolId: string,
    examId: string,
    examSubjectId: string,
    input: BulkMarksInput,
  ) {
    const exam = await assertExam(schoolId, examId);
    const examSubject = await assertExamSubject(schoolId, examId, examSubjectId);

    const enrolled = await prisma.student.findMany({
      where: { schoolId, classId: exam.classId },
      select: { id: true },
    });
    const enrolledIds = new Set(enrolled.map((s) => s.id));

    for (const record of input.records) {
      if (!enrolledIds.has(record.studentId)) {
        throw ApiError.badRequest('One or more students are not in this exam class');
      }
      if (!record.isAbsent && record.marksObtained != null && record.marksObtained > examSubject.maxMarks) {
        throw ApiError.badRequest(`Marks cannot exceed the maximum of ${examSubject.maxMarks}`);
      }
    }

    await prisma.$transaction(
      input.records.map((r) => {
        const absent = r.isAbsent ?? false;
        const marksObtained = absent ? null : (r.marksObtained ?? null);
        return prisma.mark.upsert({
          where: { examSubjectId_studentId: { examSubjectId, studentId: r.studentId } },
          update: { marksObtained, isAbsent: absent, remark: r.remark ?? null },
          create: {
            examSubjectId,
            studentId: r.studentId,
            marksObtained,
            isAbsent: absent,
            remark: r.remark ?? null,
          },
        });
      }),
    );

    return this.marksRoster(schoolId, examId, examSubjectId);
  },

  // ---- Results ----
  /** Ranked results for an exam: per-student totals, percentage, grade, pass/fail. */
  async results(schoolId: string, examId: string) {
    const exam = await assertExam(schoolId, examId);

    const [examSubjects, students] = await Promise.all([
      prisma.examSubject.findMany({
        where: { examId },
        select: {
          id: true,
          maxMarks: true,
          passMarks: true,
          marks: { select: { studentId: true, marksObtained: true, isAbsent: true } },
        },
      }),
      prisma.student.findMany({
        where: { schoolId, classId: exam.classId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
    ]);

    const totalMax = examSubjects.reduce((acc, es) => acc + es.maxMarks, 0);

    const rows = students.map((student) => {
      let obtained = 0;
      let failed = false;
      for (const es of examSubjects) {
        const mark = es.marks.find((m) => m.studentId === student.id);
        const score = mark && !mark.isAbsent ? (mark.marksObtained ?? 0) : 0;
        obtained += score;
        if (!mark || mark.isAbsent || score < es.passMarks) failed = true;
      }
      const percentage = totalMax > 0 ? Math.round((obtained / totalMax) * 10000) / 100 : 0;
      return {
        student,
        obtained,
        totalMax,
        percentage,
        grade: gradeForPercentage(percentage),
        passed: !failed && examSubjects.length > 0,
        rank: 0,
      };
    });

    // Dense rank by marks obtained (descending); tie-break by student id so
    // the ordering of equal scores is stable across calls.
    const ranked = [...rows].sort(
      (a, b) => b.obtained - a.obtained || a.student.id.localeCompare(b.student.id),
    );
    let rank = 0;
    let prev: number | null = null;
    for (const row of ranked) {
      if (prev === null || row.obtained < prev) {
        rank += 1;
        prev = row.obtained;
      }
      row.rank = rank;
    }

    return {
      exam: { id: exam.id, name: exam.name, status: exam.status },
      totalMax,
      subjectCount: examSubjects.length,
      results: ranked,
    };
  },
};
