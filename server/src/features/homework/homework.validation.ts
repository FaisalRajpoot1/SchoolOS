import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

export const createHomeworkSchema = z
  .object({
    classId: z.string().uuid(),
    sectionId: z.string().uuid(),
    subjectId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).nullish(),
    attachmentUrl: z.string().url().nullish(),
    dueDate: z.coerce.date(),
  })
  .strict();

export const updateHomeworkSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullish(),
    attachmentUrl: z.string().url().nullish(),
    subjectId: z.string().uuid().nullish(),
    dueDate: z.coerce.date().optional(),
  })
  .strict();

export const recordSubmissionSchema = z
  .object({
    content: z.string().trim().max(5000).nullish(),
    attachmentUrl: z.string().url().nullish(),
    submittedAt: z.coerce.date().optional(),
  })
  .strict();

export const gradeSubmissionSchema = z
  .object({
    feedback: z.string().trim().max(2000).nullish(),
    marks: z.coerce.number().int().min(0).max(1000).nullish(),
  })
  .strict();

export const listHomeworkSchema = paginationSchema.extend({
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
});

export const homeworkIdParamSchema = z.object({ id: z.string().uuid() });
export const submissionStudentParamSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>;
export type RecordSubmissionInput = z.infer<typeof recordSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type ListHomeworkQuery = z.infer<typeof listHomeworkSchema>;
