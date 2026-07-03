import { describe, expect, it } from 'vitest';
import { rolesForAudience } from './audience';

describe('rolesForAudience', () => {
  it('targets every school role for ALL', () => {
    const roles = rolesForAudience('ALL');
    expect(roles).toContain('SCHOOL_ADMIN');
    expect(roles).toContain('TEACHER');
    expect(roles).toContain('STUDENT');
    expect(roles).toContain('PARENT');
    expect(roles).toContain('HR');
    expect(roles).not.toContain('SUPER_ADMIN');
  });

  it('targets only students for STUDENTS and only parents for PARENTS', () => {
    expect(rolesForAudience('STUDENTS')).toEqual(['STUDENT']);
    expect(rolesForAudience('PARENTS')).toEqual(['PARENT']);
  });

  it('targets only teachers for TEACHERS', () => {
    expect(rolesForAudience('TEACHERS')).toEqual(['TEACHER']);
  });

  it('targets teachers and admin-type staff for STAFF (not students or parents)', () => {
    const roles = rolesForAudience('STAFF');
    expect(roles).toContain('TEACHER');
    expect(roles).toContain('SCHOOL_ADMIN');
    expect(roles).toContain('ACCOUNTANT');
    expect(roles).not.toContain('STUDENT');
    expect(roles).not.toContain('PARENT');
  });
});
