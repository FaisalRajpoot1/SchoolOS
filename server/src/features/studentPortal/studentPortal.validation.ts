import { z } from 'zod';

export const attendanceQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
