import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { requireSchoolId } from './tenant';

describe('requireSchoolId', () => {
  it('returns the schoolId for a school-scoped user', () => {
    expect(requireSchoolId({ schoolId: 'school-1' })).toBe('school-1');
  });

  it('throws 401 when there is no user', () => {
    expect(() => requireSchoolId(undefined)).toThrow(ApiError);
    try {
      requireSchoolId(undefined);
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(401);
    }
  });

  it('throws 403 for a user without a school (e.g. SUPER_ADMIN)', () => {
    try {
      requireSchoolId({ schoolId: null });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(403);
    }
  });
});
