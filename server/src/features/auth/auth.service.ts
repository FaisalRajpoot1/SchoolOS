import type { User } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashPassword, verifyPassword } from '@/utils/password';
import { signAccessToken } from '@/utils/jwt';
import { generateRefreshToken, hashToken } from '@/utils/tokens';
import { PASSWORD_RESET_TTL_MS, REFRESH_TOKEN_TTL_MS } from '@/config/constants';
import type { LoginInput, RegisterInput } from './auth.validation';

/** Public, safe-to-serialize view of a user. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  schoolId: string | null;
}

/** Request metadata stored with a session for auditing/management. */
export interface SessionContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  /** Raw refresh token — set by the controller as an httpOnly cookie. */
  refreshToken: string;
}

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  schoolId: user.schoolId,
});

/** Issues an access token plus a persisted, rotating refresh token (one per session). */
const issueTokens = async (user: User, context?: SessionContext): Promise<AuthResult> => {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    schoolId: user.schoolId,
  });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      userAgent: context?.userAgent ?? null,
      ipAddress: context?.ipAddress ?? null,
      lastUsedAt: new Date(),
    },
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
};

export const authService = {
  /** Registers a new user within a school tenant. */
  async register(input: RegisterInput, context?: SessionContext): Promise<AuthResult> {
    const school = await prisma.school.findUnique({ where: { id: input.schoolId } });
    if (!school || !school.isActive) {
      throw ApiError.badRequest('Invalid school');
    }

    const existing = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: input.schoolId, email: input.email } },
    });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        schoolId: input.schoolId,
      },
    });

    return issueTokens(user, context);
  },

  /** Authenticates a user with email + password scoped to a school. */
  async login(input: LoginInput, context?: SessionContext): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId: input.schoolId, email: input.email } },
    });

    // Constant-ish response: always run a comparison to limit user enumeration.
    const passwordOk = user
      ? await verifyPassword(input.password, user.passwordHash)
      : await verifyPassword(input.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv');

    if (!user || !passwordOk) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('Account is disabled');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return issueTokens(user, context);
  },

  /** Rotates a refresh token: validates, revokes the old, issues a new pair. */
  async refresh(rawToken: string, context?: SessionContext): Promise<AuthResult> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired session');
    }
    if (!stored.user.isActive) {
      throw ApiError.forbidden('Account is disabled');
    }

    // Single-use rotation, carrying forward the session's origin metadata.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return issueTokens(stored.user, {
      userAgent: context?.userAgent ?? stored.userAgent,
      ipAddress: context?.ipAddress ?? stored.ipAddress,
    });
  },

  /** Revokes a refresh token (logout). Idempotent. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /** Returns the current user's public profile. */
  async me(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return toPublicUser(user);
  },

  // ---- Password reset ----
  /**
   * Creates a single-use reset token for the matching user. Returns the raw
   * token and user id, or null when no user matches (caller must not reveal which).
   */
  async requestPasswordReset(
    schoolId: string,
    email: string,
  ): Promise<{ rawToken: string; userId: string } | null> {
    const user = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email } },
    });
    if (!user || !user.isActive) return null;

    const rawToken = generateRefreshToken();
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    return { rawToken, userId: user.id };
  },

  /** Consumes a reset token, sets a new password, and revokes all sessions. */
  async resetPassword(rawToken: string, newPassword: string): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return record.userId;
  },

  /** Changes the password for an authenticated user, keeping the current session. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentRawToken: string | undefined,
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    const currentHash = currentRawToken ? hashToken(currentRawToken) : '';
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      // Revoke every other session for safety.
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null, NOT: { tokenHash: currentHash } },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  // ---- Session management ----
  async listSessions(userId: string, currentRawToken: string | undefined) {
    const currentHash = currentRawToken ? hashToken(currentRawToken) : '';
    const sessions = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        createdAt: true,
        tokenHash: true,
      },
    });
    return sessions.map(({ tokenHash, ...s }) => ({ ...s, isCurrent: tokenHash === currentHash }));
  },

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await prisma.refreshToken.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) throw ApiError.notFound('Session not found');
  },

  async revokeOtherSessions(userId: string, currentRawToken: string | undefined): Promise<void> {
    const currentHash = currentRawToken ? hashToken(currentRawToken) : '';
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, NOT: { tokenHash: currentHash } },
      data: { revokedAt: new Date() },
    });
  },
};
