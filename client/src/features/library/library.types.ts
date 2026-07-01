import type { PaginationMeta } from '@/features/schools/schools.types';

export type LibraryIssueStatus = 'ISSUED' | 'RETURNED';

interface NamedRef {
  id: string;
  name: string;
}

export interface BookCategory {
  id: string;
  name: string;
}

export interface BookIssue {
  id: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fineAmount: number;
  status: LibraryIssueStatus;
  book: { id: string; title: string; isbn: string | null };
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  shelf: string | null;
  totalCopies: number;
  availableCopies: number;
  category: NamedRef | null;
}

export interface BookDetail extends Book {
  issues: BookIssue[];
}

export interface CreateBookPayload {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  shelf?: string;
  categoryId?: string;
  totalCopies: number;
}

export interface ListBooksParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  available?: boolean;
}

export interface ListIssuesParams {
  page?: number;
  limit?: number;
  status?: LibraryIssueStatus;
  studentId?: string;
  bookId?: string;
}

export type { PaginationMeta };
