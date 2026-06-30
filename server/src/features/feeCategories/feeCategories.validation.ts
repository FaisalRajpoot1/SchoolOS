import { z } from 'zod';

export const createFeeCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(200).nullish(),
  })
  .strict();

export const updateFeeCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(200).nullish(),
  })
  .strict();

export const feeCategoryIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateFeeCategoryInput = z.infer<typeof createFeeCategorySchema>;
export type UpdateFeeCategoryInput = z.infer<typeof updateFeeCategorySchema>;
