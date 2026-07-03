import { z } from 'zod';

const band = z.object({
  label: z.string().trim().min(1).max(16),
  minPercentage: z.coerce.number().int().min(0).max(100),
});

/** Replaces a school's grade scheme. Bands must cover from 0 and be distinct. */
export const setGradeSchemeSchema = z
  .object({
    bands: z.array(band).min(1).max(20),
  })
  .strict()
  .superRefine((data, ctx) => {
    const labels = data.bands.map((b) => b.label.toLowerCase());
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Grade labels must be unique', path: ['bands'] });
    }
    const mins = data.bands.map((b) => b.minPercentage);
    if (new Set(mins).size !== mins.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Each band needs a distinct minimum %', path: ['bands'] });
    }
    if (Math.min(...mins) !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The lowest band must start at 0% so every score maps to a grade',
        path: ['bands'],
      });
    }
  });

export type SetGradeSchemeInput = z.infer<typeof setGradeSchemeSchema>;
