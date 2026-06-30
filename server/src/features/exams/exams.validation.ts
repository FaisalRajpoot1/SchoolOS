import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

export const createExamSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    classId: z.string().uuid(),
    academicYearId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .strict();

export const updateExamSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
  })
  .strict();

export const updateExamSubjectSchema = z
  .object({
    maxMarks: z.coerce.number().int().min(1).max(1000).optional(),
    passMarks: z.coerce.number().int().min(0).max(1000).optional(),
    examDate: z.coerce.date().nullish(),
  })
  .strict();

export const bulkMarksSchema = z
  .object({
    records: z
      .array(
        z
          .object({
            studentId: z.string().uuid(),
            marksObtained: z.coerce.number().int().min(0).max(1000).nullish(),
            isAbsent: z.boolean().optional(),
            remark: z.string().trim().max(200).nullish(),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();

export const listExamsSchema = paginationSchema.extend({
  classId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const examIdParamSchema = z.object({ id: z.string().uuid() });
export const examSubjectParamSchema = z.object({
  id: z.string().uuid(),
  examSubjectId: z.string().uuid(),
});
export const studentReportParamSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type UpdateExamSubjectInput = z.infer<typeof updateExamSubjectSchema>;
export type BulkMarksInput = z.infer<typeof bulkMarksSchema>;
export type ListExamsQuery = z.infer<typeof listExamsSchema>;
