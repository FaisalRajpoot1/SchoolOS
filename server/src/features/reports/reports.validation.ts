import { z } from 'zod';

export const attendanceRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AttendanceRange = z.infer<typeof attendanceRangeSchema>;
