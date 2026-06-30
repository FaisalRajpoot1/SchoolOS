import { createHash, randomBytes } from 'node:crypto';

/**
 * Opaque refresh tokens. The raw token is sent to the client as an
 * httpOnly cookie; only its SHA-256 hash is persisted, so a database
 * leak cannot be replayed.
 */
export const generateRefreshToken = (): string => randomBytes(48).toString('hex');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
