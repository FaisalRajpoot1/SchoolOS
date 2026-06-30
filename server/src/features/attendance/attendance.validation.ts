import { z } from 'zod';

const attendanceStatus = z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']);

export const rosterQuerySchema = z.object({
  sectionId: z.string().uuid(),
  date: z.coerce.date(),
});

export const bulkMarkSchema = z
  .object({
    sectionId: z.string().uuid(),
    date: z.coerce.date(),
    records: z
      .array(
        z
          .object({
            studentId: z.string().uuid(),
            status: attendanceStatus,
            remark: z.string().trim().max(200).nullish(),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();

export const studentHistoryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const studentIdParamSchema = z.object({ studentId: z.string().uuid() });

export type RosterQuery = z.infer<typeof rosterQuerySchema>;
export type BulkMarkInput = z.infer<typeof bulkMarkSchema>;
export type StudentHistoryQuery = z.infer<typeof studentHistoryQuerySchema>;
