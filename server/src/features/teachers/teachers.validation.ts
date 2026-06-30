import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const gender = z.enum(['MALE', 'FEMALE', 'OTHER']);
const staffStatus = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']);

export const createTeacherSchema = z
  .object({
    employeeNo: z.string().trim().min(1).max(40).optional(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    phone: z.string().trim().min(3).max(30).optional(),
    gender: gender.optional(),
    dateOfBirth: z.coerce.date().optional(),
    qualification: z.string().trim().max(120).optional(),
    experienceYears: z.coerce.number().int().min(0).max(80).optional(),
    salary: z.coerce.number().int().min(0).max(100_000_000).optional(),
    joiningDate: z.coerce.date().optional(),
  })
  .strict();

export const updateTeacherSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().min(3).max(30).nullish(),
    gender: gender.nullish(),
    dateOfBirth: z.coerce.date().nullish(),
    qualification: z.string().trim().max(120).nullish(),
    experienceYears: z.coerce.number().int().min(0).max(80).nullish(),
    salary: z.coerce.number().int().min(0).max(100_000_000).nullish(),
    joiningDate: z.coerce.date().optional(),
  })
  .strict();

export const setTeacherStatusSchema = z.object({ status: staffStatus }).strict();

export const listTeachersSchema = paginationSchema.extend({
  status: staffStatus.optional(),
});

export const teacherIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type ListTeachersQuery = z.infer<typeof listTeachersSchema>;
