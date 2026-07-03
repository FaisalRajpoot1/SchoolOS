import { type AnnouncementAudience, Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { notificationsService } from '@/features/notifications/notifications.service';
import type {
  CreateAnnouncementInput,
  ListAnnouncementsQuery,
  UpdateAnnouncementInput,
} from './announcements.validation';

/** The set of audiences a given role should see on their notice board. */
const audiencesForRole = (role: UserRole): AnnouncementAudience[] => {
  switch (role) {
    case 'TEACHER':
      return ['ALL', 'TEACHERS', 'STAFF'];
    case 'STUDENT':
      return ['ALL', 'STUDENTS'];
    case 'PARENT':
      return ['ALL', 'PARENTS'];
    case 'SCHOOL_ADMIN':
    case 'ACCOUNTANT':
    case 'LIBRARIAN':
    case 'RECEPTIONIST':
    case 'HR':
      return ['ALL', 'STAFF'];
    default:
      return ['ALL'];
  }
};

const authorSelect = { author: { select: { id: true, firstName: true, lastName: true } } } as const;

const assertAnnouncement = async (schoolId: string, id: string): Promise<void> => {
  const found = await prisma.announcement.findFirst({ where: { id, schoolId }, select: { id: true } });
  if (!found) throw ApiError.notFound('Announcement not found');
};

export const announcementsService = {
  async create(schoolId: string, authorId: string, input: CreateAnnouncementInput) {
    const announcement = await prisma.announcement.create({
      data: {
        schoolId,
        authorId,
        title: input.title,
        body: input.body,
        audience: input.audience,
        pinned: input.pinned ?? false,
        publishedAt: input.publishedAt ?? new Date(),
        expiresAt: input.expiresAt ?? null,
      },
      include: authorSelect,
    });

    // Fan out an inbox notification to the audience (best-effort — a delivery
    // failure must not fail the publish). The author is excluded.
    await notificationsService.notifyAudienceSafe(
      schoolId,
      announcement.audience,
      {
        type: 'ANNOUNCEMENT',
        title: `New notice: ${announcement.title}`,
        body: announcement.body.slice(0, 280),
        link: '/announcements',
      },
      authorId,
    );

    return announcement;
  },

  async list(
    schoolId: string,
    query: ListAnnouncementsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.AnnouncementWhereInput = {
      schoolId,
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        include: authorSelect,
      }),
      prisma.announcement.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, schoolId },
      include: authorSelect,
    });
    if (!announcement) throw ApiError.notFound('Announcement not found');
    return announcement;
  },

  async update(schoolId: string, id: string, input: UpdateAnnouncementInput) {
    await assertAnnouncement(schoolId, id);
    return prisma.announcement.update({ where: { id }, data: input, include: authorSelect });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertAnnouncement(schoolId, id);
    await prisma.announcement.delete({ where: { id } });
  },

  /** The active, audience-appropriate notice board for a user. */
  async feed(schoolId: string, role: UserRole) {
    const now = new Date();
    return prisma.announcement.findMany({
      where: {
        schoolId,
        audience: { in: audiencesForRole(role) },
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 50,
      include: authorSelect,
    });
  },
};
