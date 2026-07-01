import { z } from 'zod';

export const reportCommentSchema = z.object({ studentId: z.string().uuid() }).strict();

export const generateSchema = z
  .object({
    kind: z.enum(['homework', 'questions']),
    subject: z.string().trim().min(1).max(80),
    topic: z.string().trim().min(1).max(120),
    grade: z.string().trim().min(1).max(40),
    count: z.coerce.number().int().min(1).max(20).default(5),
  })
  .strict();

export type ReportCommentInput = z.infer<typeof reportCommentSchema>;
export type GenerateInput = z.infer<typeof generateSchema>;
