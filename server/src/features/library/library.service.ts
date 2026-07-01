import { type Book, type BookCategory, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { LIBRARY_FINE_PER_DAY } from '@/config/constants';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreateBookCategoryInput,
  CreateBookInput,
  IssueBookInput,
  ListBooksQuery,
  ListIssuesQuery,
  UpdateBookInput,
} from './library.validation';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const duplicateCategory = (err: unknown): ApiError | null =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    ? ApiError.conflict('A category with this name already exists')
    : null;

const assertBook = async (schoolId: string, id: string): Promise<Book> => {
  const book = await prisma.book.findFirst({ where: { id, schoolId } });
  if (!book) throw ApiError.notFound('Book not found');
  return book;
};

const issueInclude = {
  book: { select: { id: true, title: true, isbn: true } },
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
} satisfies Prisma.BookIssueInclude;

export const libraryService = {
  // ---- Categories ----
  async createCategory(schoolId: string, input: CreateBookCategoryInput): Promise<BookCategory> {
    try {
      return await prisma.bookCategory.create({ data: { schoolId, name: input.name } });
    } catch (err) {
      throw duplicateCategory(err) ?? err;
    }
  },

  listCategories(schoolId: string): Promise<BookCategory[]> {
    return prisma.bookCategory.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  },

  async updateCategory(schoolId: string, id: string, name: string): Promise<BookCategory> {
    const existing = await prisma.bookCategory.findFirst({ where: { id, schoolId } });
    if (!existing) throw ApiError.notFound('Category not found');
    try {
      return await prisma.bookCategory.update({ where: { id }, data: { name } });
    } catch (err) {
      throw duplicateCategory(err) ?? err;
    }
  },

  async removeCategory(schoolId: string, id: string): Promise<void> {
    const existing = await prisma.bookCategory.findFirst({ where: { id, schoolId } });
    if (!existing) throw ApiError.notFound('Category not found');
    await prisma.bookCategory.delete({ where: { id } });
  },

  // ---- Books ----
  async createBook(schoolId: string, input: CreateBookInput): Promise<Book> {
    if (input.categoryId) {
      const category = await prisma.bookCategory.findFirst({
        where: { id: input.categoryId, schoolId },
      });
      if (!category) throw ApiError.badRequest('Invalid category for this school');
    }
    return prisma.book.create({
      data: {
        schoolId,
        title: input.title,
        author: input.author ?? null,
        publisher: input.publisher ?? null,
        isbn: input.isbn ?? null,
        shelf: input.shelf ?? null,
        categoryId: input.categoryId ?? null,
        totalCopies: input.totalCopies,
        availableCopies: input.totalCopies,
      },
    });
  },

  async listBooks(
    schoolId: string,
    query: ListBooksQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.BookWhereInput = {
      schoolId,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.available ? { availableCopies: { gt: 0 } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { author: { contains: query.search, mode: 'insensitive' } },
              { isbn: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        skip,
        take,
        orderBy: { title: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.book.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getBook(schoolId: string, id: string) {
    const book = await prisma.book.findFirst({
      where: { id, schoolId },
      include: {
        category: { select: { id: true, name: true } },
        issues: {
          where: { status: 'ISSUED' },
          include: issueInclude,
          orderBy: { issueDate: 'desc' },
        },
      },
    });
    if (!book) throw ApiError.notFound('Book not found');
    return book;
  },

  /** Updates a book; if totalCopies changes, adjusts availableCopies by the delta. */
  async updateBook(schoolId: string, id: string, input: UpdateBookInput): Promise<Book> {
    const existing = await assertBook(schoolId, id);
    if (input.categoryId) {
      const category = await prisma.bookCategory.findFirst({
        where: { id: input.categoryId, schoolId },
      });
      if (!category) throw ApiError.badRequest('Invalid category for this school');
    }

    let availableCopies = existing.availableCopies;
    if (input.totalCopies !== undefined) {
      const delta = input.totalCopies - existing.totalCopies;
      availableCopies = Math.max(0, existing.availableCopies + delta);
    }

    return prisma.book.update({ where: { id }, data: { ...input, availableCopies } });
  },

  async removeBook(schoolId: string, id: string): Promise<void> {
    await assertBook(schoolId, id);
    await prisma.book.delete({ where: { id } });
  },

  // ---- Issue / Return ----
  async issueBook(schoolId: string, bookId: string, input: IssueBookInput) {
    const book = await assertBook(schoolId, bookId);
    if (book.availableCopies < 1) throw ApiError.badRequest('No copies available to issue');

    const student = await prisma.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: { id: true },
    });
    if (!student) throw ApiError.badRequest('Invalid student for this school');

    return prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.create({
        data: {
          schoolId,
          bookId,
          studentId: input.studentId,
          dueDate: input.dueDate,
        },
        include: issueInclude,
      });
      await tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      });
      return issue;
    });
  },

  /** Returns a book, computing a late fine and restoring a copy. */
  async returnBook(schoolId: string, issueId: string) {
    const issue = await prisma.bookIssue.findFirst({ where: { id: issueId, schoolId } });
    if (!issue) throw ApiError.notFound('Issue record not found');
    if (issue.status === 'RETURNED') throw ApiError.badRequest('This book is already returned');

    const now = new Date();
    const daysLate = Math.max(
      0,
      Math.ceil((now.getTime() - issue.dueDate.getTime()) / MS_PER_DAY),
    );
    const fineAmount = daysLate * LIBRARY_FINE_PER_DAY;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.bookIssue.update({
        where: { id: issueId },
        data: { status: 'RETURNED', returnDate: now, fineAmount },
        include: issueInclude,
      });
      await tx.book.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });
      return updated;
    });
  },

  async listIssues(
    schoolId: string,
    query: ListIssuesQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.BookIssueWhereInput = {
      schoolId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.bookId ? { bookId: query.bookId } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.bookIssue.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: query.sortOrder },
        include: issueInclude,
      }),
      prisma.bookIssue.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },
};
