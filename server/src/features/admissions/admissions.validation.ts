import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const gender = z.enum(['MALE', 'FEMALE', 'OTHER']);
const status = z.enum(['SUBMITTED', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'CONVERTED']);

/** Public admission-application form submission. */
export const applySchema = z
  .object({
    schoolId: z.string().uuid(),
    applicantFirstName: z.string().trim().min(1).max(80),
    applicantLastName: z.string().trim().min(1).max(80),
    gender: gender.optional(),
    dateOfBirth: z.coerce.date().optional(),
    guardianName: z.string().trim().min(1).max(120),
    guardianPhone: z.string().trim().min(3).max(30),
    guardianEmail: z.string().email().optional(),
    desiredClass: z.string().trim().max(80).optional(),
    message: z.string().trim().max(1000).optional(),
  })
  .strict();

export const listAdmissionsSchema = paginationSchema.extend({
  status: status.optional(),
});

export const admissionIdParamSchema = z.object({ id: z.string().uuid() });
export const schoolParamSchema = z.object({ schoolId: z.string().uuid() });

/** Status transitions available to admins (CONVERTED is done via /convert). */
export const updateStatusSchema = z
  .object({ status: z.enum(['SUBMITTED', 'REVIEWING', 'ACCEPTED', 'REJECTED']) })
  .strict();

export const convertSchema = z
  .object({
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  })
  .strict();

export type ApplyInput = z.infer<typeof applySchema>;
export type ListAdmissionsQuery = z.infer<typeof listAdmissionsSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ConvertInput = z.infer<typeof convertSchema>;
