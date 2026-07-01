import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from './library.api';
import type { CreateBookPayload, ListBooksParams, ListIssuesParams } from './library.types';

const keys = {
  categories: ['library', 'categories'] as const,
  books: ['library', 'books'] as const,
  book: (id: string) => ['library', 'book', id] as const,
  issues: ['library', 'issues'] as const,
};

// Categories
export const useBookCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: libraryApi.listCategories });

export const useCreateBookCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => libraryApi.createCategory(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categories }),
  });
};

export const useDeleteBookCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.removeCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categories }),
  });
};

// Books
export const useBooks = (params: ListBooksParams) =>
  useQuery({ queryKey: [...keys.books, params], queryFn: () => libraryApi.listBooks(params) });

export const useBook = (id: string) =>
  useQuery({ queryKey: keys.book(id), queryFn: () => libraryApi.getBook(id), enabled: !!id });

export const useCreateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookPayload) => libraryApi.createBook(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.books }),
  });
};

export const useDeleteBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.removeBook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.books }),
  });
};

// Issue / return
const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ['library'] });
};

export const useIssueBook = (bookId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, dueDate }: { studentId: string; dueDate: string }) =>
      libraryApi.issueBook(bookId, studentId, dueDate),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useReturnBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => libraryApi.returnBook(issueId),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useIssues = (params: ListIssuesParams) =>
  useQuery({ queryKey: [...keys.issues, params], queryFn: () => libraryApi.listIssues(params) });
