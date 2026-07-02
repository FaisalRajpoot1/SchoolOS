import { prisma } from '@/db/prisma';
import { gradeForPercentage } from '@/features/exams/grade';

const submissionSelect = {
  submittedAt: true,
  isLate: true,
  marks: true,
  feedback: true,
  gradedAt: true,
} as const;

/** A student's section homework with their own submission (or null). */
export const homeworkForStudent = async (
  schoolId: string,
  studentId: string,
  sectionId: string | null,
) => {
  if (!sectionId) return [];
  const homeworks = await prisma.homework.findMany({
    where: { schoolId, sectionId },
    orderBy: { dueDate: 'desc' },
    include: {
      subject: { select: { id: true, name: true } },
      submissions: { where: { studentId }, select: submissionSelect },
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
};

/** A student's section assignments with their own submission (or null). */
export const assignmentsForStudent = async (
  schoolId: string,
  studentId: string,
  sectionId: string | null,
) => {
  if (!sectionId) return [];
  const assignments = await prisma.assignment.findMany({
    where: { schoolId, sectionId },
    orderBy: { dueDate: 'desc' },
    include: {
      subject: { select: { id: true, name: true } },
      submissions: { where: { studentId }, select: submissionSelect },
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
};

/** Published exam results for a student, computed per exam. */
export const resultsForStudent = async (
  schoolId: string,
  studentId: string,
  classId: string | null,
) => {
  if (!classId) return [];
  const exams = await prisma.exam.findMany({
    where: { schoolId, classId, status: 'PUBLISHED' },
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
};
