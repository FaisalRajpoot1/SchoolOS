import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const eventType = z.enum(['GENERAL', 'HOLIDAY', 'EXAM', 'PTM', 'COMPETITION', 'SPORTS']);
const audience = z.enum(['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF']);

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).nullish(),
    type: eventType.default('GENERAL'),
    audience: audience.default('ALL'),
    location: z.string().trim().max(120).nullish(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullish(),
    allDay: z.boolean().optional(),
  })
  .strict()
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).nullish(),
    type: eventType.optional(),
    audience: audience.optional(),
    location: z.string().trim().max(120).nullish(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullish(),
    allDay: z.boolean().optional(),
  })
  .strict();

export const listEventsSchema = paginationSchema.extend({
  type: eventType.optional(),
});

export const calendarQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const eventIdParamSchema = z.object({ id: z.string().uuid() });

export const rsvpBodySchema = z
  .object({ status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']) })
  .strict();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsSchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type RsvpInput = z.infer<typeof rsvpBodySchema>;
