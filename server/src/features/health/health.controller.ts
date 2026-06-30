import type { Request, Response } from 'express';
import { prisma } from '@/db/prisma';
import { asyncHandler } from '@/utils/asyncHandler';

/** Liveness probe — process is up. */
export const liveness = (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
};

/** Readiness probe — dependencies (database) are reachable. */
export const readiness = asyncHandler(async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.status(200).json({ success: true, status: 'ready' });
});
