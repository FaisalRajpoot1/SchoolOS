import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const certificateType = z.enum(['BONAFIDE', 'CHARACTER', 'TRANSFER', 'LEAVING']);

export const createCertificateSchema = z
  .object({
    studentId: z.string().uuid(),
    type: certificateType,
    title: z.string().trim().min(1).max(120).optional(),
    body: z.string().trim().min(1).max(4000).optional(),
  })
  .strict();

export const listCertificatesSchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  type: certificateType.optional(),
});

export const certificateIdParamSchema = z.object({ id: z.string().uuid() });
export const verifyCodeParamSchema = z.object({ code: z.string().trim().min(6).max(64) });

export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type ListCertificatesQuery = z.infer<typeof listCertificatesSchema>;
