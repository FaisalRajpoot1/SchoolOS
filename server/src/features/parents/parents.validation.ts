import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

export const createParentSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    phone: z.string().trim().min(3).max(30).optional(),
    occupation: z.string().trim().max(80).optional(),
    address: z.string().trim().max(200).optional(),
    studentIds: z.array(z.string().uuid()).max(20).optional(),
  })
  .strict();

export const updateParentSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().min(3).max(30).nullish(),
    occupation: z.string().trim().max(80).nullish(),
    address: z.string().trim().max(200).nullish(),
  })
  .strict();

export const linkChildSchema = z
  .object({
    studentId: z.string().uuid(),
    relation: z.string().trim().max(40).nullish(),
  })
  .strict();

export const listParentsSchema = paginationSchema;

export const parentIdParamSchema = z.object({ id: z.string().uuid() });
export const childParamSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
export type LinkChildInput = z.infer<typeof linkChildSchema>;
export type ListParentsQuery = z.infer<typeof listParentsSchema>;
