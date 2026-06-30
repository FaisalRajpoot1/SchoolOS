import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import type { UserRole } from '@prisma/client';

/** Claims encoded in the short-lived access token. */
export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  schoolId: string | null;
}

/** Signs a short-lived access token. */
export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });

/** Verifies and decodes an access token. Throws if invalid/expired. */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Malformed access token');
  }
  return decoded as AccessTokenPayload;
};
