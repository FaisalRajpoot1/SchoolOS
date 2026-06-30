import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

export const listAuditLogsSchema = paginationSchema.extend({
  action: z.string().trim().min(1).max(60).optional(),
  userId: z.string().uuid().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>;
