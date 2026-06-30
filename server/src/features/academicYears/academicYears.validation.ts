import { z } from 'zod';

export const createAcademicYearSchema = z
  .object({
    name: z.string().min(2).max(40),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.startDate < data.endDate, {
    message: 'startDate must be before endDate',
    path: ['endDate'],
  });

export const updateAcademicYearSchema = z
  .object({
    name: z.string().min(2).max(40).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.startDate === undefined || data.endDate === undefined || data.startDate < data.endDate,
    { message: 'startDate must be before endDate', path: ['endDate'] },
  );

export const academicYearIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
