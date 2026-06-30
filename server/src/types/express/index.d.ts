import type { UserRole } from '@prisma/client';

/** The authenticated principal attached to a request by the auth middleware. */
export interface AuthUser {
  id: string;
  role: UserRole;
  schoolId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
