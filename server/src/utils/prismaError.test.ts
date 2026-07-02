import { describe, expect, it } from 'vitest';
import { mapPrismaError } from './prismaError';

describe('mapPrismaError', () => {
  it('maps unique-constraint (P2002) to 409', () => {
    expect(mapPrismaError('P2002')).toEqual({
      statusCode: 409,
      message: 'A record with these details already exists',
    });
  });

  it('maps record-not-found (P2025) to 404', () => {
    expect(mapPrismaError('P2025')?.statusCode).toBe(404);
  });

  it('maps foreign-key violation (P2003) to 409', () => {
    expect(mapPrismaError('P2003')?.statusCode).toBe(409);
  });

  it('returns null for unhandled codes', () => {
    expect(mapPrismaError('P2010')).toBeNull();
    expect(mapPrismaError('')).toBeNull();
  });
});
