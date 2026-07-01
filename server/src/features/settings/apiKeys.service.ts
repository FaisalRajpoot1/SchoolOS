import { randomBytes } from 'node:crypto';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashToken } from '@/utils/tokens';
import type { CreateApiKeyInput } from './apiKeys.validation';

const publicSelect = {
  id: true,
  name: true,
  prefix: true,
  lastUsedAt: true,
  createdAt: true,
} as const;

export const apiKeysService = {
  /** Creates a key; the raw value is returned once and never stored in plaintext. */
  async create(schoolId: string, input: CreateApiKeyInput) {
    const raw = `sk_${randomBytes(24).toString('hex')}`;
    const apiKey = await prisma.apiKey.create({
      data: {
        schoolId,
        name: input.name,
        prefix: raw.slice(0, 11),
        keyHash: hashToken(raw),
      },
      select: publicSelect,
    });
    return { apiKey, key: raw };
  },

  list(schoolId: string) {
    return prisma.apiKey.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: publicSelect,
    });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    const existing = await prisma.apiKey.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw ApiError.notFound('API key not found');
    await prisma.apiKey.delete({ where: { id } });
  },
};
