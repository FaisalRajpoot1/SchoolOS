import { ApiError } from '@/utils/ApiError';

/**
 * Returns the tenant (school) id for a school-scoped principal, or throws.
 * SUPER_ADMIN has no school and must not reach school-scoped handlers.
 */
export const requireSchoolId = (user: { schoolId: string | null } | undefined): string => {
  if (!user) throw ApiError.unauthorized();
  if (!user.schoolId) throw ApiError.forbidden('This action requires a school-scoped account');
  return user.schoolId;
};
