import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { aiEnabled, complete } from './aiClient';
import type { GenerateInput, ReportCommentInput } from './ai.validation';

interface AiResult {
  content: string;
  source: 'ai' | 'rules';
}

const performanceBand = (avg: number): string =>
  avg >= 75 ? 'excellent' : avg >= 60 ? 'good' : avg >= 40 ? 'satisfactory' : 'below-average';

export const aiService = {
  /** A short report-card comment grounded in the student's marks + attendance. */
  async reportComment(schoolId: string, input: ReportCommentInput): Promise<AiResult> {
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: { firstName: true, lastName: true, class: { select: { name: true } } },
    });
    if (!student) throw ApiError.notFound('Student not found');

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [marks, attendance] = await Promise.all([
      prisma.mark.findMany({
        where: { studentId: input.studentId, marksObtained: { not: null } },
        select: { marksObtained: true, examSubject: { select: { maxMarks: true } } },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { studentId: input.studentId, schoolId, date: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const avg =
      marks.length > 0
        ? Math.round(
            (marks.reduce((acc, m) => acc + (m.marksObtained ?? 0) / m.examSubject.maxMarks, 0) / marks.length) * 100,
          )
        : 0;
    const marked = attendance.reduce((acc, a) => acc + a._count._all, 0);
    const present = attendance.find((a) => a.status === 'PRESENT')?._count._all ?? 0;
    const attRate = marked > 0 ? Math.round((present / marked) * 100) : 0;

    const name = `${student.firstName} ${student.lastName}`;
    const band = performanceBand(avg);

    if (aiEnabled) {
      const system =
        'You are an experienced class teacher writing a concise, constructive report-card comment. ' +
        'Write 2-3 sentences, warm but honest, addressed about the student in the third person. No preamble.';
      const prompt =
        `Student: ${name}\nClass: ${student.class?.name ?? 'N/A'}\n` +
        `Average score: ${avg}% (${band})\nAttendance: ${attRate}%\n` +
        `Write the report-card comment.`;
      const content = await complete(system, prompt);
      return { content, source: 'ai' };
    }

    const content =
      `${name} has demonstrated ${band} academic performance this term, with an average score of ${avg}% ` +
      `and ${attRate}% attendance. ` +
      (avg >= 60
        ? 'Keep up the consistent effort and continue building on these strengths.'
        : 'With focused effort and regular attendance, there is clear room to improve.');
    return { content, source: 'rules' };
  },

  /** Generates homework tasks or exam questions for a subject/topic/grade. */
  async generate(input: GenerateInput): Promise<AiResult> {
    const label = input.kind === 'homework' ? 'homework tasks' : 'exam questions';

    if (aiEnabled) {
      const system =
        'You are a curriculum expert creating school assessment material. ' +
        'Return a clean numbered list only, no preamble or closing remarks.';
      const prompt =
        `Create ${input.count} ${label} for grade ${input.grade}, subject "${input.subject}", ` +
        `topic "${input.topic}". Vary the difficulty and cognitive level.`;
      const content = await complete(system, prompt);
      return { content, source: 'ai' };
    }

    const verbs =
      input.kind === 'homework'
        ? ['Explain', 'Describe', 'List the key points of', 'Give two examples of', 'Summarize']
        : ['Define', 'Explain with an example', 'Compare and contrast aspects of', 'Analyze', 'Evaluate'];
    const lines = Array.from({ length: input.count }, (_, i) => {
      const verb = verbs[i % verbs.length];
      return `${i + 1}. ${verb} ${input.topic} in the context of ${input.subject} (grade ${input.grade}).`;
    });
    return { content: lines.join('\n'), source: 'rules' };
  },
};
