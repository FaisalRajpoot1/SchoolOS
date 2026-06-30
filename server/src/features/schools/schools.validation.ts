import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Theme color must be a 6-digit hex value');

const minuteOfDay = z.coerce.number().int().min(0).max(1439);

/** Shared, editable profile fields (used by update + profile update). */
const schoolProfileFields = {
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().nullish(),
  phone: z.string().min(5).max(30).nullish(),
  logoUrl: z.string().url().nullish(),
  websiteUrl: z.string().url().nullish(),
  address: z.string().max(200).nullish(),
  city: z.string().max(80).nullish(),
  state: z.string().max(80).nullish(),
  country: z.string().max(80).nullish(),
  postalCode: z.string().max(20).nullish(),
  timezone: z.string().min(1).max(60).optional(),
  currency: z.string().length(3).optional(),
  locale: z.string().min(2).max(10).optional(),
  themeColor: hexColor.optional(),
  dayStartMinute: minuteOfDay.optional(),
  dayEndMinute: minuteOfDay.optional(),
};

const dayWindowValid = (data: { dayStartMinute?: number; dayEndMinute?: number }): boolean =>
  data.dayStartMinute === undefined ||
  data.dayEndMinute === undefined ||
  data.dayStartMinute < data.dayEndMinute;

/** SUPER_ADMIN creates a school plus its first SCHOOL_ADMIN. */
export const createSchoolSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers, and hyphens')
      .min(2)
      .max(60)
      .optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).max(30).optional(),
    admin: z.object({
      email: z.string().email(),
      password: z.string().min(8).max(72),
      firstName: z.string().min(1).max(80),
      lastName: z.string().min(1).max(80),
    }),
  })
  .strict();

export const updateSchoolSchema = z
  .object(schoolProfileFields)
  .strict()
  .refine(dayWindowValid, { message: 'dayStartMinute must be before dayEndMinute' });

export const listSchoolsSchema = paginationSchema.extend({
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const schoolIdParamSchema = z.object({ id: z.string().uuid() });

export const setSchoolStatusSchema = z.object({ isActive: z.boolean() }).strict();

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type ListSchoolsQuery = z.infer<typeof listSchoolsSchema>;
