import { z } from 'zod';

const code = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^[A-Za-z0-9-]+$/, 'Code may contain letters, numbers, and hyphens');

export const createSubjectSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    code: code,
  })
  .strict();

export const updateSubjectSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    code: code.optional(),
  })
  .strict();

export const subjectIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
