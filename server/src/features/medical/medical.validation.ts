import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
const visitOutcome = z.enum(['RESOLVED', 'SENT_HOME', 'REFERRED', 'MONITORING']);

/** Upsert payload for a student's standing medical profile. */
export const upsertProfileSchema = z
  .object({
    bloodGroup: z.enum(BLOOD_GROUPS).nullish(),
    heightCm: z.coerce.number().int().min(30).max(300).nullish(),
    weightKg: z.coerce.number().int().min(2).max(500).nullish(),
    allergies: z.string().trim().max(1000).nullish(),
    conditions: z.string().trim().max(1000).nullish(),
    medications: z.string().trim().max(1000).nullish(),
    emergencyContactName: z.string().trim().max(120).nullish(),
    emergencyContactPhone: z.string().trim().max(30).nullish(),
    notes: z.string().trim().max(2000).nullish(),
  })
  .strict();

export const createVisitSchema = z
  .object({
    studentId: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
    treatment: z.string().trim().max(1000).nullish(),
    temperatureC: z.coerce.number().min(30).max(45).nullish(),
    outcome: visitOutcome.default('RESOLVED'),
    visitedOn: z.coerce.date().optional(),
  })
  .strict();

export const listVisitsSchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  outcome: visitOutcome.optional(),
});

export const studentIdParamSchema = z.object({ studentId: z.string().uuid() });
export const visitIdParamSchema = z.object({ id: z.string().uuid() });

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type ListVisitsQuery = z.infer<typeof listVisitsSchema>;
