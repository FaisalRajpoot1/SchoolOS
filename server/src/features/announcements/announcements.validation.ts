import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const audience = z.enum(['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF']);

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(5000),
    audience: audience.default('ALL'),
    pinned: z.boolean().optional(),
    publishedAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().nullish(),
  })
  .strict();

export const updateAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    body: z.string().trim().min(1).max(5000).optional(),
    audience: audience.optional(),
    pinned: z.boolean().optional(),
    publishedAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().nullish(),
  })
  .strict();

export const listAnnouncementsSchema = paginationSchema;
export const announcementIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsSchema>;
