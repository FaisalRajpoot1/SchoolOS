import { api } from '@/lib/axios';
import type {
  Book,
  BookCategory,
  BookDetail,
  BookIssue,
  CreateBookPayload,
  ListBooksParams,
  ListIssuesParams,
  PaginationMeta,
} from './library.types';

export const libraryApi = {
  // Categories
  async listCategories(): Promise<BookCategory[]> {
    const { data } = await api.get<{ data: BookCategory[] }>('/library/categories');
    return data.data;
  },
  async createCategory(name: string): Promise<BookCategory> {
    const { data } = await api.post<{ data: { category: BookCategory } }>('/library/categories', { name });
    return data.data.category;
  },
  async removeCategory(id: string): Promise<void> {
    await api.delete(`/library/categories/${id}`);
  },

  // Books
  async listBooks(params: ListBooksParams): Promise<{ items: Book[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Book[]; meta: PaginationMeta }>('/library/books', { params });
    return { items: data.data, meta: data.meta };
  },
  async getBook(id: string): Promise<BookDetail> {
    const { data } = await api.get<{ data: { book: BookDetail } }>(`/library/books/${id}`);
    return data.data.book;
  },
  async createBook(payload: CreateBookPayload): Promise<Book> {
    const { data } = await api.post<{ data: { book: Book } }>('/library/books', payload);
    return data.data.book;
  },
  async removeBook(id: string): Promise<void> {
    await api.delete(`/library/books/${id}`);
  },

  // Issue / return
  async issueBook(bookId: string, studentId: string, dueDate: string): Promise<BookIssue> {
    const { data } = await api.post<{ data: { issue: BookIssue } }>(`/library/books/${bookId}/issue`, {
      studentId,
      dueDate,
    });
    return data.data.issue;
  },
  async returnBook(issueId: string): Promise<BookIssue> {
    const { data } = await api.post<{ data: { issue: BookIssue } }>(`/library/issues/${issueId}/return`);
    return data.data.issue;
  },
  async listIssues(params: ListIssuesParams): Promise<{ items: BookIssue[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: BookIssue[]; meta: PaginationMeta }>('/library/issues', { params });
    return { items: data.data, meta: data.meta };
  },
};
