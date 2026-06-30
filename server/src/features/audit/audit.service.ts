import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '@/db/prisma';
import { logger } from '@/utils/logger';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type { ListAuditLogsQuery } from './audit.validation';

export interface AuditContext {
  userId?: string | null;
  schoolId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/** Best-effort audit write — never throws into the request path. */
export const recordAudit = async (action: string, ctx: AuditContext): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: ctx.userId ?? null,
        schoolId: ctx.schoolId ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        metadata: ctx.metadata,
      },
    });
  } catch (err) {
    logger.error({ err, action }, 'Failed to write audit log');
  }
};

/** Convenience: derive ip/userAgent from a request. */
export const auditFromRequest = (
  req: Request,
  extra: Omit<AuditContext, 'ipAddress' | 'userAgent'> = {},
): AuditContext => ({
  ipAddress: req.ip ?? null,
  userAgent: req.headers['user-agent'] ?? null,
  ...extra,
});

export const auditService = {
  /** Lists audit logs, scoped to a school unless the caller is platform-wide. */
  async list(
    scope: { schoolId: string | null; platformWide: boolean },
    query: ListAuditLogsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.AuditLogWhereInput = {
      ...(scope.platformWide ? {} : { schoolId: scope.schoolId }),
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },
};
