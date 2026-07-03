import { type AnnouncementAudience, type NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { rolesForAudience } from './audience';
import type { ListNotificationsQuery } from './notifications.validation';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * Upper bound on recipients fanned out synchronously in one request. Fan-out is
 * a single `createMany`, but this caps the unbounded per-tenant work on the hot
 * path until delivery moves to a background job. Overflow is logged, not silent.
 */
const MAX_FANOUT_RECIPIENTS = 5000;

const toRow = (schoolId: string, userId: string, input: NotificationInput) => ({
  schoolId,
  userId,
  type: input.type,
  title: input.title,
  body: input.body ?? null,
  link: input.link ?? null,
});

export const notificationsService = {
  // ---- Recipient inbox (own notifications only) ----

  async list(
    schoolId: string,
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.NotificationWhereInput = {
      schoolId,
      userId,
      ...(query.unread ? { readAt: null } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  unreadCount(schoolId: string, userId: string): Promise<number> {
    return prisma.notification.count({ where: { schoolId, userId, readAt: null } });
  },

  async markRead(schoolId: string, userId: string, id: string): Promise<void> {
    // Scope by userId so a caller can only mark their own notifications.
    const result = await prisma.notification.updateMany({
      where: { id, schoolId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      // Distinguish "already read / not found" from "belongs to someone else".
      const exists = await prisma.notification.findFirst({
        where: { id, schoolId, userId },
        select: { id: true },
      });
      if (!exists) throw ApiError.notFound('Notification not found');
    }
  },

  async markAllRead(schoolId: string, userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: { schoolId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  },

  async remove(schoolId: string, userId: string, id: string): Promise<void> {
    const result = await prisma.notification.deleteMany({ where: { id, schoolId, userId } });
    if (result.count === 0) throw ApiError.notFound('Notification not found');
  },

  // ---- Producers (called by other modules) ----

  /** Delivers a notification to a single user. */
  notify(schoolId: string, userId: string, input: NotificationInput) {
    return prisma.notification.create({ data: toRow(schoolId, userId, input) });
  },

  /** Delivers the same notification to many users; returns the number created. */
  async notifyUsers(
    schoolId: string,
    userIds: string[],
    input: NotificationInput,
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => toRow(schoolId, userId, input)),
    });
    return result.count;
  },

  /**
   * Fans a notification out to every active user whose role receives `audience`,
   * optionally excluding one user (e.g. the author). Returns the number created.
   */
  async notifyAudience(
    schoolId: string,
    audience: AnnouncementAudience,
    input: NotificationInput,
    excludeUserId?: string,
  ): Promise<number> {
    const users = await prisma.user.findMany({
      where: {
        schoolId,
        isActive: true,
        role: { in: rolesForAudience(audience) },
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      // Fetch one past the cap so we can detect (and log) truncation.
      take: MAX_FANOUT_RECIPIENTS + 1,
      select: { id: true },
    });
    if (users.length > MAX_FANOUT_RECIPIENTS) {
      logger.warn(
        { schoolId, audience, recipients: users.length },
        `Notification fan-out exceeded ${MAX_FANOUT_RECIPIENTS}; delivering to the first ${MAX_FANOUT_RECIPIENTS} only`,
      );
    }
    return this.notifyUsers(
      schoolId,
      users.slice(0, MAX_FANOUT_RECIPIENTS).map((u) => u.id),
      input,
    );
  },

  /** Best-effort fan-out: never throws, so it can't break the triggering action. */
  async notifyAudienceSafe(
    schoolId: string,
    audience: AnnouncementAudience,
    input: NotificationInput,
    excludeUserId?: string,
  ): Promise<void> {
    try {
      await this.notifyAudience(schoolId, audience, input, excludeUserId);
    } catch (err) {
      logger.error({ err, schoolId, audience }, 'Failed to fan out notifications');
    }
  },
};
