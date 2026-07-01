import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const criterionSchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    maxPoints: z.coerce.number().int().min(1).max(1000),
  })
  .strict();

export const createAssignmentSchema = z
  .object({
    classId: z.string().uuid(),
    sectionId: z.string().uuid(),
    subjectId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).nullish(),
    instructions: z.string().trim().max(4000).nullish(),
    attachmentUrl: z.string().url().nullish(),
    maxMarks: z.coerce.number().int().min(1).max(1000),
    dueDate: z.coerce.date(),
    criteria: z.array(criterionSchema).max(20).optional(),
  })
  .strict();

export const updateAssignmentSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullish(),
    instructions: z.string().trim().max(4000).nullish(),
    attachmentUrl: z.string().url().nullish(),
    subjectId: z.string().uuid().nullish(),
    maxMarks: z.coerce.number().int().min(1).max(1000).optional(),
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
    marks: z.coerce.number().int().min(0).max(1000).nullish(),
    feedback: z.string().trim().max(2000).nullish(),
  })
  .strict();

export const listAssignmentsSchema = paginationSchema.extend({
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
});

export const assignmentIdParamSchema = z.object({ id: z.string().uuid() });
export const submissionStudentParamSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type RecordSubmissionInput = z.infer<typeof recordSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsSchema>;
