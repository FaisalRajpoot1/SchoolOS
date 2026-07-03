import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const category = z.enum([
  'GENERAL',
  'ID_PROOF',
  'CERTIFICATE',
  'REPORT',
  'MEDICAL',
  'CONTRACT',
  'OTHER',
]);

/** Text fields accompanying the multipart upload (the file is parsed separately). */
export const createDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    category: category.default('GENERAL'),
    studentId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
  })
  .strict()
  .refine((d) => !(d.studentId && d.employeeId), {
    message: 'A document can belong to a student or an employee, not both',
    path: ['employeeId'],
  });

export const listDocumentsSchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  category: category.optional(),
});

export const documentIdParamSchema = z.object({ id: z.string().uuid() });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsSchema>;
