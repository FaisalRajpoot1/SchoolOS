import { z } from 'zod';

export const createApiKeySchema = z.object({ name: z.string().trim().min(1).max(60) }).strict();
export const apiKeyIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
