import { z } from 'zod';

/** Reusable pagination + search query schema for list endpoints. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z.string().min(1).max(40).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Translates a validated page/limit into Prisma `skip`/`take`. */
export const toPrismaPagination = (query: PaginationQuery): { skip: number; take: number } => ({
  skip: (query.page - 1) * query.limit,
  take: query.limit,
});

/** Builds response metadata for a paginated result set. */
export const buildPaginationMeta = (
  query: Pick<PaginationQuery, 'page' | 'limit'>,
  total: number,
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPrevPage: query.page > 1,
  };
};
