import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

// ---- Categories ----
export const createBookCategorySchema = z
  .object({ name: z.string().trim().min(2).max(60) })
  .strict();
export const updateBookCategorySchema = z
  .object({ name: z.string().trim().min(2).max(60) })
  .strict();
export const bookCategoryIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Books ----
export const createBookSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    author: z.string().trim().max(120).nullish(),
    publisher: z.string().trim().max(120).nullish(),
    isbn: z.string().trim().max(20).nullish(),
    shelf: z.string().trim().max(40).nullish(),
    categoryId: z.string().uuid().nullish(),
    totalCopies: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .strict();

export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    author: z.string().trim().max(120).nullish(),
    publisher: z.string().trim().max(120).nullish(),
    isbn: z.string().trim().max(20).nullish(),
    shelf: z.string().trim().max(40).nullish(),
    categoryId: z.string().uuid().nullish(),
    totalCopies: z.coerce.number().int().min(1).max(10000).optional(),
  })
  .strict();

export const listBooksSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  available: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const bookIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Issues ----
export const issueBookSchema = z
  .object({
    studentId: z.string().uuid(),
    dueDate: z.coerce.date(),
  })
  .strict();

export const listIssuesSchema = paginationSchema.extend({
  status: z.enum(['ISSUED', 'RETURNED']).optional(),
  studentId: z.string().uuid().optional(),
  bookId: z.string().uuid().optional(),
});

export const issueIdParamSchema = z.object({ issueId: z.string().uuid() });

export type CreateBookCategoryInput = z.infer<typeof createBookCategorySchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ListBooksQuery = z.infer<typeof listBooksSchema>;
export type IssueBookInput = z.infer<typeof issueBookSchema>;
export type ListIssuesQuery = z.infer<typeof listIssuesSchema>;
