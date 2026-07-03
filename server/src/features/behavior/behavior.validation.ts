import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const behaviorType = z.enum(['MERIT', 'DEMERIT', 'INCIDENT']);

/** Points must agree in sign with the record type (merits ≥ 0, demerits ≤ 0). */
const pointsAgreeWithType = (d: { type: 'MERIT' | 'DEMERIT' | 'INCIDENT'; points: number }): boolean => {
  if (d.type === 'MERIT') return d.points >= 0;
  if (d.type === 'DEMERIT') return d.points <= 0;
  return true;
};

export const createBehaviorSchema = z
  .object({
    studentId: z.string().uuid(),
    type: behaviorType,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).nullish(),
    points: z.coerce.number().int().min(-1000).max(1000).default(0),
    occurredOn: z.coerce.date().optional(),
  })
  .strict()
  .refine(pointsAgreeWithType, {
    message: 'points must be ≥ 0 for a merit and ≤ 0 for a demerit',
    path: ['points'],
  });

export const updateBehaviorSchema = z
  .object({
    type: behaviorType.optional(),
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).nullish(),
    points: z.coerce.number().int().min(-1000).max(1000).optional(),
    occurredOn: z.coerce.date().optional(),
  })
  .strict();

export const listBehaviorSchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  type: behaviorType.optional(),
});

export const behaviorIdParamSchema = z.object({ id: z.string().uuid() });
export const studentIdParamSchema = z.object({ studentId: z.string().uuid() });

export type CreateBehaviorInput = z.infer<typeof createBehaviorSchema>;
export type UpdateBehaviorInput = z.infer<typeof updateBehaviorSchema>;
export type ListBehaviorQuery = z.infer<typeof listBehaviorSchema>;
