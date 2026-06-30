import type { User } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashPassword, verifyPassword } from '@/utils/password';
import { signAccessToken } from '@/utils/jwt';
import { generateRefreshToken, hashToken } from '@/utils/tokens';
import { REFRESH_TOKEN_TTL_MS } from '@/config/constants';
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

/** Issues an access token plus a persisted, rotating refresh token. */
const issueTokens = async (user: User): Promise<AuthResult> => {
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
    },
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
};

export const authService = {
  /** Registers a new user within a school tenant. */
  async register(input: RegisterInput): Promise<AuthResult> {
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

    return issueTokens(user);
  },

  /** Authenticates a user with email + password scoped to a school. */
  async login(input: LoginInput): Promise<AuthResult> {
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

    return issueTokens(user);
  },

  /** Rotates a refresh token: validates, revokes the old, issues a new pair. */
  async refresh(rawToken: string): Promise<AuthResult> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired session');
    }

    // Single-use rotation.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return issueTokens(stored.user);
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
};
