import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

export const listNotificationsSchema = paginationSchema.extend({
  unread: z.coerce.boolean().optional(),
});

export const notificationIdParamSchema = z.object({ id: z.string().uuid() });

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
