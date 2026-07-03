import type { AnnouncementAudience, UserRole } from '@prisma/client';

/** Roles that belong to a school (SUPER_ADMIN has none) and can receive notices. */
const SCHOOL_ROLES: UserRole[] = [
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'ACCOUNTANT',
  'LIBRARIAN',
  'RECEPTIONIST',
  'HR',
];

/** The audiences a given role sees — kept in sync with announcements/events. */
const audiencesForRole = (role: UserRole): AnnouncementAudience[] => {
  switch (role) {
    case 'TEACHER':
      return ['ALL', 'TEACHERS', 'STAFF'];
    case 'STUDENT':
      return ['ALL', 'STUDENTS'];
    case 'PARENT':
      return ['ALL', 'PARENTS'];
    case 'SCHOOL_ADMIN':
    case 'ACCOUNTANT':
    case 'LIBRARIAN':
    case 'RECEPTIONIST':
    case 'HR':
      return ['ALL', 'STAFF'];
    default:
      return ['ALL'];
  }
};

/**
 * Inverts `audiencesForRole`: the school roles that should receive a message
 * targeting `audience`. Pure and env-free so it can be unit-tested. Guarantees
 * the notification inbox matches what each role can already see on the board.
 */
export const rolesForAudience = (audience: AnnouncementAudience): UserRole[] =>
  SCHOOL_ROLES.filter((role) => audiencesForRole(role).includes(audience));
