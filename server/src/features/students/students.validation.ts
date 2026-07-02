import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const gender = z.enum(['MALE', 'FEMALE', 'OTHER']);
const studentStatus = z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'ALUMNI']);

export const guardianInputSchema = z
  .object({
    relation: z.string().trim().min(1).max(40),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(3).max(30).nullish(),
    email: z.string().email().nullish(),
    occupation: z.string().trim().max(80).nullish(),
    address: z.string().trim().max(200).nullish(),
    isPrimary: z.boolean().optional(),
  })
  .strict();

export const createStudentSchema = z
  .object({
    admissionNo: z.string().trim().min(1).max(40).optional(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    gender: gender.optional(),
    dateOfBirth: z.coerce.date().optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(3).max(30).optional(),
    address: z.string().trim().max(200).optional(),
    admissionDate: z.coerce.date().optional(),
    classId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    guardians: z.array(guardianInputSchema).max(10).optional(),
  })
  .strict();

export const updateStudentSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    gender: gender.nullish(),
    dateOfBirth: z.coerce.date().nullish(),
    email: z.string().email().nullish(),
    phone: z.string().trim().min(3).max(30).nullish(),
    address: z.string().trim().max(200).nullish(),
    classId: z.string().uuid().nullish(),
    sectionId: z.string().uuid().nullish(),
  })
  .strict();

export const updateGuardianSchema = guardianInputSchema.partial();

export const setStudentStatusSchema = z.object({ status: studentStatus }).strict();

export const listStudentsSchema = paginationSchema.extend({
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  status: studentStatus.optional(),
});

export const studentIdParamSchema = z.object({ id: z.string().uuid() });

export const portalAccessSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  })
  .strict();
export const guardianIdParamSchema = z.object({
  id: z.string().uuid(),
  guardianId: z.string().uuid(),
});

/** One row of a bulk student import (class/section referenced by name). */
export const importRowSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    admissionNo: z.string().trim().min(1).max(40).optional(),
    gender: gender.optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(3).max(30).optional(),
    className: z.string().trim().max(80).optional(),
    sectionName: z.string().trim().max(80).optional(),
  })
  .strict();

export const bulkImportSchema = z
  .object({
    dryRun: z.boolean().default(false),
    rows: z.array(importRowSchema).min(1).max(500),
  })
  .strict();

/** Promote active students from one class to another, or graduate them. */
export const promoteStudentsSchema = z
  .object({
    fromClassId: z.string().uuid(),
    toClassId: z.string().uuid().optional(),
    toSectionId: z.string().uuid().optional(),
    graduate: z.boolean().default(false),
  })
  .strict()
  .refine((d) => d.graduate || !!d.toClassId, {
    message: 'Provide a target class or set graduate',
  })
  .refine((d) => !(d.graduate && d.toClassId), {
    message: 'Choose either promote or graduate, not both',
  });

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsSchema>;
export type GuardianInput = z.infer<typeof guardianInputSchema>;
export type PortalAccessInput = z.infer<typeof portalAccessSchema>;
export type ImportRow = z.infer<typeof importRowSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;
