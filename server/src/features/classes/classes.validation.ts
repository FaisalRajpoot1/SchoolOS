import { z } from 'zod';

export const createClassSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    level: z.coerce.number().int().min(0).max(100).optional(),
  })
  .strict();

export const updateClassSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    level: z.coerce.number().int().min(0).max(100).nullish(),
  })
  .strict();

export const createSectionSchema = z
  .object({
    name: z.string().trim().min(1).max(20),
    capacity: z.coerce.number().int().min(1).max(1000).optional(),
  })
  .strict();

export const updateSectionSchema = z
  .object({
    name: z.string().trim().min(1).max(20).optional(),
    capacity: z.coerce.number().int().min(1).max(1000).nullish(),
    classTeacherId: z.string().uuid().nullish(),
  })
  .strict();

export const setSubjectTeacherSchema = z
  .object({ teacherId: z.string().uuid().nullable() })
  .strict();

export const classSubjectParamSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

export const setClassSubjectsSchema = z
  .object({
    subjectIds: z.array(z.string().uuid()).max(200),
  })
  .strict();

export const classIdParamSchema = z.object({ classId: z.string().uuid() });
export const sectionIdParamSchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type SetClassSubjectsInput = z.infer<typeof setClassSubjectsSchema>;
