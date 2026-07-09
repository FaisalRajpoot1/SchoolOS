import { type UserRole, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { notificationsService } from '@/features/notifications/notifications.service';
import type { CreateThreadInput, PostMessageInput } from './messages.validation';

type Actor = { id: string; role: UserRole };

const userSelect = { id: true, firstName: true, lastName: true } as const;

const threadSelect = {
  id: true,
  subject: true,
  createdAt: true,
  lastMessageAt: true,
  parentUserId: true,
  teacherUserId: true,
  parentUser: { select: userSelect },
  teacherUser: { select: userSelect },
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
} satisfies Prisma.MessageThreadSelect;

/** Shapes a thread for the caller: names the other participant + my role. */
const toThreadView = (
  thread: Prisma.MessageThreadGetPayload<{ select: typeof threadSelect }>,
  userId: string,
  unreadCount = 0,
) => {
  const iAmParent = thread.parentUserId === userId;
  const other = iAmParent ? thread.teacherUser : thread.parentUser;
  return {
    id: thread.id,
    subject: thread.subject,
    createdAt: thread.createdAt,
    lastMessageAt: thread.lastMessageAt,
    withName: `${other.firstName} ${other.lastName}`,
    withRole: iAmParent ? 'TEACHER' : 'PARENT',
    student: thread.student
      ? { id: thread.student.id, name: `${thread.student.firstName} ${thread.student.lastName}` }
      : null,
    unreadCount,
  };
};

/** True when `userId` is one of the thread's two participants. */
const isParticipant = (
  thread: { parentUserId: string; teacherUserId: string },
  userId: string,
): boolean => thread.parentUserId === userId || thread.teacherUserId === userId;

export const messagesService = {
  /** Threads the caller participates in, newest activity first, with unread counts. */
  async listThreads(schoolId: string, actor: Actor) {
    const threads = await prisma.messageThread.findMany({
      where: { schoolId, OR: [{ parentUserId: actor.id }, { teacherUserId: actor.id }] },
      orderBy: { lastMessageAt: 'desc' },
      select: threadSelect,
    });
    if (threads.length === 0) return [];

    // Unread = messages in my threads I didn't send and haven't read yet.
    const unreadGroups = await prisma.message.groupBy({
      by: ['threadId'],
      where: {
        threadId: { in: threads.map((t) => t.id) },
        readAt: null,
        senderId: { not: actor.id },
      },
      _count: { _all: true },
    });
    const unreadByThread = new Map(unreadGroups.map((g) => [g.threadId, g._count._all]));

    return threads.map((t) => toThreadView(t, actor.id, unreadByThread.get(t.id) ?? 0));
  },

  /** A thread with its messages; marks incoming messages read for the caller. */
  async getThread(schoolId: string, actor: Actor, threadId: string) {
    const thread = await prisma.messageThread.findFirst({
      where: { id: threadId, schoolId },
      select: threadSelect,
    });
    if (!thread || !isParticipant(thread, actor.id)) throw ApiError.notFound('Thread not found');

    await prisma.message.updateMany({
      where: { threadId, senderId: { not: actor.id }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, body: true, createdAt: true, senderId: true, readAt: true },
    });

    return {
      thread: toThreadView(thread, actor.id),
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        mine: m.senderId === actor.id,
        readAt: m.readAt,
      })),
    };
  },

  /** Starts a thread between a parent and a teacher (caller is one side). */
  async createThread(schoolId: string, actor: Actor, input: CreateThreadInput) {
    if (actor.role !== 'PARENT' && actor.role !== 'TEACHER') {
      throw ApiError.forbidden('Only parents and teachers can start conversations');
    }
    // The initiator is one participant; the counterparty must hold the other role.
    const counterRole: UserRole = actor.role === 'PARENT' ? 'TEACHER' : 'PARENT';
    const counter = await prisma.user.findFirst({
      where: { id: input.toUserId, schoolId, role: counterRole },
      select: { id: true },
    });
    if (!counter) throw ApiError.badRequest('The selected recipient is not valid');
    if (counter.id === actor.id) throw ApiError.badRequest('You cannot message yourself');

    const parentUserId = actor.role === 'PARENT' ? actor.id : counter.id;
    const teacherUserId = actor.role === 'TEACHER' ? actor.id : counter.id;

    if (input.studentId) {
      // The optional student context must be one of the parent participant's
      // children — a parent (or teacher) can't attach an arbitrary student.
      const link = await prisma.parentStudent.findFirst({
        where: { studentId: input.studentId, parent: { userId: parentUserId, schoolId } },
        select: { id: true },
      });
      if (!link) throw ApiError.badRequest('That student is not linked to the parent in this conversation');
    }

    const thread = await prisma.$transaction(async (tx) => {
      const created = await tx.messageThread.create({
        data: {
          schoolId,
          subject: input.subject,
          parentUserId,
          teacherUserId,
          studentId: input.studentId ?? null,
        },
        select: threadSelect,
      });
      await tx.message.create({
        data: { threadId: created.id, senderId: actor.id, body: input.body },
      });
      return created;
    });

    await this.notifyCounterparty(schoolId, counter.id, thread.id, input.subject);
    return toThreadView(thread, actor.id, 0);
  },

  /** Posts a message to an existing thread (participant only). */
  async postMessage(schoolId: string, actor: Actor, threadId: string, input: PostMessageInput) {
    const thread = await prisma.messageThread.findFirst({
      where: { id: threadId, schoolId },
      select: { id: true, subject: true, parentUserId: true, teacherUserId: true },
    });
    if (!thread || !isParticipant(thread, actor.id)) throw ApiError.notFound('Thread not found');

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { threadId, senderId: actor.id, body: input.body },
        select: { id: true, body: true, createdAt: true, senderId: true, readAt: true },
      });
      await tx.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });

    const recipientId =
      thread.parentUserId === actor.id ? thread.teacherUserId : thread.parentUserId;
    await this.notifyCounterparty(schoolId, recipientId, threadId, thread.subject);

    return { id: message.id, body: message.body, createdAt: message.createdAt, mine: true, readAt: null };
  },

  /** Best-effort in-app notification to the other participant. */
  async notifyCounterparty(
    schoolId: string,
    recipientUserId: string,
    threadId: string,
    subject: string,
  ): Promise<void> {
    try {
      await notificationsService.notifyUsers(schoolId, [recipientUserId], {
        type: 'GENERAL',
        title: 'New message',
        body: subject,
        link: `/messages/${threadId}`,
      });
    } catch {
      // Best-effort: never let a notification failure break sending a message.
    }
  },

  /**
   * People the caller may start a conversation with. Parents see the teachers
   * who teach their children; teachers see the parents of their students.
   */
  async contacts(schoolId: string, actor: Actor) {
    if (actor.role === 'PARENT') return this.parentContacts(schoolId, actor.id);
    if (actor.role === 'TEACHER') return this.teacherContacts(schoolId, actor.id);
    return [];
  },

  async parentContacts(schoolId: string, userId: string) {
    const parent = await prisma.parent.findFirst({
      where: { userId, schoolId },
      select: { children: { select: { student: { select: { sectionId: true } } } } },
    });
    if (!parent) return [];
    const sectionIds = [
      ...new Set(parent.children.map((c) => c.student.sectionId).filter((s): s is string => !!s)),
    ];
    if (sectionIds.length === 0) return [];

    const [sections, slots] = await Promise.all([
      prisma.section.findMany({
        where: { id: { in: sectionIds }, class: { schoolId } },
        select: { classTeacherId: true },
      }),
      prisma.timetableSlot.findMany({
        where: { schoolId, sectionId: { in: sectionIds }, teacherId: { not: null } },
        select: { teacherId: true },
        distinct: ['teacherId'],
      }),
    ]);
    const teacherIds = [
      ...new Set(
        [...sections.map((s) => s.classTeacherId), ...slots.map((s) => s.teacherId)].filter(
          (t): t is string => !!t,
        ),
      ),
    ];
    if (teacherIds.length === 0) return [];

    const teachers = await prisma.teacher.findMany({
      where: { id: { in: teacherIds }, schoolId, userId: { not: null } },
      select: { userId: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return teachers.map((t) => ({ userId: t.userId as string, name: `${t.firstName} ${t.lastName}` }));
  },

  async teacherContacts(schoolId: string, userId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    });
    if (!teacher) return [];

    const [classSections, slotSections] = await Promise.all([
      prisma.section.findMany({
        where: { classTeacherId: teacher.id, class: { schoolId } },
        select: { id: true },
      }),
      prisma.timetableSlot.findMany({
        where: { schoolId, teacherId: teacher.id },
        select: { sectionId: true },
        distinct: ['sectionId'],
      }),
    ]);
    const sectionIds = [
      ...new Set([...classSections.map((s) => s.id), ...slotSections.map((s) => s.sectionId)]),
    ];
    if (sectionIds.length === 0) return [];

    const links = await prisma.parentStudent.findMany({
      where: {
        parent: { schoolId },
        student: { schoolId, sectionId: { in: sectionIds }, status: 'ACTIVE' },
      },
      select: {
        parent: { select: { userId: true, firstName: true, lastName: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    });

    // One entry per parent user, listing the children they can be reached about.
    const byUser = new Map<string, { userId: string; name: string; students: string[] }>();
    for (const link of links) {
      const entry = byUser.get(link.parent.userId) ?? {
        userId: link.parent.userId,
        name: `${link.parent.firstName} ${link.parent.lastName}`,
        students: [],
      };
      entry.students.push(`${link.student.firstName} ${link.student.lastName}`);
      byUser.set(link.parent.userId, entry);
    }
    return [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
};
