import { z } from 'zod';

export const createThreadSchema = z
  .object({
    toUserId: z.string().uuid(),
    studentId: z.string().uuid().optional(),
    subject: z.string().trim().min(1).max(150),
    body: z.string().trim().min(1).max(5000),
  })
  .strict();

export const postMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(5000),
  })
  .strict();

export const threadIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type PostMessageInput = z.infer<typeof postMessageSchema>;
