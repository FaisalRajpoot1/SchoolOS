import { z } from 'zod';

const dayOfWeek = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
const minute = z.coerce.number().int().min(0).max(1440);

export const createSlotSchema = z
  .object({
    sectionId: z.string().uuid(),
    dayOfWeek,
    startMinute: minute,
    endMinute: minute,
    subjectId: z.string().uuid().optional(),
    teacherId: z.string().uuid().optional(),
    room: z.string().trim().max(40).nullish(),
  })
  .strict()
  .refine((d) => d.startMinute < d.endMinute, {
    message: 'startMinute must be before endMinute',
    path: ['endMinute'],
  });

export const updateSlotSchema = z
  .object({
    dayOfWeek: dayOfWeek.optional(),
    startMinute: minute.optional(),
    endMinute: minute.optional(),
    subjectId: z.string().uuid().nullish(),
    teacherId: z.string().uuid().nullish(),
    room: z.string().trim().max(40).nullish(),
  })
  .strict();

export const listSlotsSchema = z
  .object({
    sectionId: z.string().uuid().optional(),
    teacherId: z.string().uuid().optional(),
  })
  .refine((d) => !!d.sectionId || !!d.teacherId, {
    message: 'Provide either sectionId or teacherId',
  });

export const slotIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type ListSlotsQuery = z.infer<typeof listSlotsSchema>;
