import { PrismaClient } from '@prisma/client';
import { isProduction } from '@/config/env';

/**
 * Singleton Prisma client. In development we cache it on `globalThis`
 * to avoid exhausting connections across hot reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'warn', 'error'],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
