import QRCode from 'qrcode';
import type { User } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { verifyPassword } from '@/utils/password';
import { hashToken } from '@/utils/tokens';
import { generateBackupCodes, normalizeBackupCode } from './backupCodes';
import { buildOtpAuthUrl, generateTotpSecret, verifyTotp } from './totp';

const BACKUP_CODE_COUNT = 10;

const hashCode = (code: string): string => hashToken(normalizeBackupCode(code));

/** Replaces a user's backup codes with a fresh set; returns the plaintext ones. */
const issueBackupCodes = async (userId: string): Promise<string[]> => {
  const codes = generateBackupCodes(BACKUP_CODE_COUNT);
  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId } }),
    prisma.backupCode.createMany({
      data: codes.map((code) => ({ userId, codeHash: hashCode(code) })),
    }),
  ]);
  return codes;
};

export const twoFactorService = {
  /** Begins setup: stores a pending secret and returns the QR/otpauth details. */
  async setup(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    if (user.totpEnabled) throw ApiError.badRequest('Two-factor auth is already enabled');

    const secret = generateTotpSecret();
    await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });

    const otpauthUrl = buildOtpAuthUrl(secret, user.email);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrDataUrl };
  },

  /** Confirms setup with the first code, enables 2FA, and returns backup codes. */
  async enable(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    if (user.totpEnabled) throw ApiError.badRequest('Two-factor auth is already enabled');
    if (!user.totpSecret) throw ApiError.badRequest('Start two-factor setup first');
    if (!verifyTotp(user.totpSecret, code)) throw ApiError.badRequest('Invalid verification code');

    await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
    const backupCodes = await issueBackupCodes(userId);
    return { backupCodes };
  },

  /** Disables 2FA after re-authenticating with the account password. */
  async disable(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw ApiError.badRequest('Password is incorrect');
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { totpEnabled: false, totpSecret: null },
      }),
      prisma.backupCode.deleteMany({ where: { userId } }),
    ]);
  },

  /** Regenerates backup codes; requires a current TOTP code. */
  async regenerateBackupCodes(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    if (!user.totpEnabled || !user.totpSecret) {
      throw ApiError.badRequest('Two-factor auth is not enabled');
    }
    if (!verifyTotp(user.totpSecret, code)) throw ApiError.badRequest('Invalid verification code');
    return { backupCodes: await issueBackupCodes(userId) };
  },

  async status(userId: string): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
    const [user, backupCodesRemaining] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { totpEnabled: true } }),
      prisma.backupCode.count({ where: { userId, usedAt: null } }),
    ]);
    return { enabled: user?.totpEnabled ?? false, backupCodesRemaining };
  },

  /**
   * Verifies a login second factor: a TOTP code, or a single-use backup code
   * (consumed atomically). Returns true on success.
   */
  async verifySecondFactor(
    user: Pick<User, 'id' | 'totpSecret'>,
    input: { totpCode?: string; backupCode?: string },
  ): Promise<boolean> {
    if (input.totpCode && user.totpSecret) {
      return verifyTotp(user.totpSecret, input.totpCode);
    }
    if (input.backupCode) {
      const result = await prisma.backupCode.updateMany({
        where: { userId: user.id, codeHash: hashCode(input.backupCode), usedAt: null },
        data: { usedAt: new Date() },
      });
      return result.count === 1;
    }
    return false;
  },
};
