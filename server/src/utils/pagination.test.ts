import { describe, expect, it } from 'vitest';
import { buildPaginationMeta, paginationSchema, toPrismaPagination } from './pagination';

describe('paginationSchema', () => {
  it('applies defaults for an empty query', () => {
    const parsed = paginationSchema.parse({});
    expect(parsed).toMatchObject({ page: 1, limit: 20, sortOrder: 'desc' });
  });

  it('coerces string numbers from query strings', () => {
    const parsed = paginationSchema.parse({ page: '3', limit: '50' });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it('rejects a limit above the cap', () => {
    expect(paginationSchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('rejects a non-positive page', () => {
    expect(paginationSchema.safeParse({ page: '0' }).success).toBe(false);
  });
});

describe('toPrismaPagination', () => {
  it('computes skip/take from page and limit', () => {
    expect(toPrismaPagination({ page: 1, limit: 20, sortOrder: 'desc' })).toEqual({ skip: 0, take: 20 });
    expect(toPrismaPagination({ page: 3, limit: 20, sortOrder: 'desc' })).toEqual({ skip: 40, take: 20 });
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages and navigation flags', () => {
    const meta = buildPaginationMeta({ page: 2, limit: 10 }, 25);
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('never reports fewer than one page, even with zero results', () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10 }, 0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});
