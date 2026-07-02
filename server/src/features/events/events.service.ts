import { type AnnouncementAudience, type Event, Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { buildEventIcs, icsDateTime } from './event.ics';
import type {
  CalendarQuery,
  CreateEventInput,
  ListEventsQuery,
  UpdateEventInput,
} from './events.validation';

/** Audiences a given role should see on the calendar. */
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

const DEFAULT_WINDOW_DAYS = 60;

const assertEvent = async (schoolId: string, id: string): Promise<Event> => {
  const event = await prisma.event.findFirst({ where: { id, schoolId } });
  if (!event) throw ApiError.notFound('Event not found');
  return event;
};

export const eventsService = {
  create(schoolId: string, input: CreateEventInput): Promise<Event> {
    return prisma.event.create({
      data: {
        schoolId,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        audience: input.audience,
        location: input.location ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        allDay: input.allDay ?? true,
      },
    });
  },

  async list(
    schoolId: string,
    query: ListEventsQuery,
  ): Promise<{ items: Event[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.EventWhereInput = {
      schoolId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.event.findMany({ where, skip, take, orderBy: { startDate: 'desc' } }),
      prisma.event.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  getById(schoolId: string, id: string): Promise<Event> {
    return assertEvent(schoolId, id);
  },

  async update(schoolId: string, id: string, input: UpdateEventInput): Promise<Event> {
    await assertEvent(schoolId, id);
    return prisma.event.update({ where: { id }, data: input });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertEvent(schoolId, id);
    await prisma.event.delete({ where: { id } });
  },

  /** Audience-appropriate events overlapping a date window (default: next 60 days). */
  calendar(schoolId: string, role: UserRole, query: CalendarQuery): Promise<Event[]> {
    const from = query.from ?? new Date();
    const to = query.to ?? new Date(from.getTime() + DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    return prisma.event.findMany({
      where: {
        schoolId,
        audience: { in: audiencesForRole(role) },
        startDate: { lte: to },
        // Overlaps the window: multi-day events by endDate, single-day by startDate.
        OR: [{ endDate: { gte: from } }, { endDate: null, startDate: { gte: from } }],
      },
      orderBy: { startDate: 'asc' },
      take: 200,
    });
  },

  /** Renders an event the caller may see as a downloadable iCalendar (.ics). */
  async renderIcs(
    schoolId: string,
    role: UserRole,
    id: string,
  ): Promise<{ content: string; filename: string }> {
    const event = await prisma.event.findFirst({
      where: { id, schoolId, audience: { in: audiencesForRole(role) } },
    });
    if (!event) throw ApiError.notFound('Event not found');
    return {
      content: buildEventIcs(event, icsDateTime(new Date())),
      filename: `event-${event.id}.ics`,
    };
  },
};
