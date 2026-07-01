import { type DayOfWeek, Prisma, type TimetableSlot } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type { CreateSlotInput, ListSlotsQuery, UpdateSlotInput } from './timetable.validation';

const hhmm = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const slotInclude = {
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, firstName: true, lastName: true } },
  section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
} satisfies Prisma.TimetableSlotInclude;

const assertSection = async (schoolId: string, sectionId: string): Promise<void> => {
  const section = await prisma.section.findFirst({ where: { id: sectionId, class: { schoolId } } });
  if (!section) throw ApiError.notFound('Section not found');
};

const assertTeacher = async (schoolId: string, teacherId: string): Promise<void> => {
  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
  if (!teacher) throw ApiError.badRequest('Invalid teacher for this school');
};

const assertSubject = async (schoolId: string, subjectId: string): Promise<void> => {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) throw ApiError.badRequest('Invalid subject for this school');
};

interface SlotWindow {
  sectionId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  teacherId?: string | null;
  room?: string | null;
}

/**
 * Rejects overlaps for the same section, teacher, or room on the same day.
 * Two intervals overlap when existing.start < new.end AND existing.end > new.start.
 */
const assertNoConflicts = async (
  schoolId: string,
  slot: SlotWindow,
  excludeId?: string,
): Promise<void> => {
  const overlap = {
    startMinute: { lt: slot.endMinute },
    endMinute: { gt: slot.startMinute },
    dayOfWeek: slot.dayOfWeek,
    ...(excludeId ? { NOT: { id: excludeId } } : {}),
  } satisfies Prisma.TimetableSlotWhereInput;

  const sectionClash = await prisma.timetableSlot.findFirst({
    where: { ...overlap, sectionId: slot.sectionId },
  });
  if (sectionClash) {
    throw ApiError.conflict(
      `This section already has a slot on ${slot.dayOfWeek} at ${hhmm(sectionClash.startMinute)}–${hhmm(sectionClash.endMinute)}`,
    );
  }

  if (slot.teacherId) {
    const teacherClash = await prisma.timetableSlot.findFirst({
      where: { ...overlap, schoolId, teacherId: slot.teacherId },
    });
    if (teacherClash) {
      throw ApiError.conflict(
        `The teacher is already booked on ${slot.dayOfWeek} at ${hhmm(teacherClash.startMinute)}–${hhmm(teacherClash.endMinute)}`,
      );
    }
  }

  if (slot.room) {
    const roomClash = await prisma.timetableSlot.findFirst({
      where: { ...overlap, schoolId, room: slot.room },
    });
    if (roomClash) {
      throw ApiError.conflict(
        `Room ${slot.room} is already booked on ${slot.dayOfWeek} at ${hhmm(roomClash.startMinute)}–${hhmm(roomClash.endMinute)}`,
      );
    }
  }
};

const assertSlot = async (schoolId: string, id: string): Promise<TimetableSlot> => {
  const slot = await prisma.timetableSlot.findFirst({ where: { id, schoolId } });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  return slot;
};

export const timetableService = {
  async create(schoolId: string, input: CreateSlotInput) {
    await assertSection(schoolId, input.sectionId);
    if (input.subjectId) await assertSubject(schoolId, input.subjectId);
    if (input.teacherId) await assertTeacher(schoolId, input.teacherId);

    await assertNoConflicts(schoolId, {
      sectionId: input.sectionId,
      dayOfWeek: input.dayOfWeek,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      teacherId: input.teacherId,
      room: input.room,
    });

    return prisma.timetableSlot.create({
      data: {
        schoolId,
        sectionId: input.sectionId,
        dayOfWeek: input.dayOfWeek,
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        subjectId: input.subjectId ?? null,
        teacherId: input.teacherId ?? null,
        room: input.room ?? null,
      },
      include: slotInclude,
    });
  },

  async list(schoolId: string, query: ListSlotsQuery) {
    if (query.sectionId) await assertSection(schoolId, query.sectionId);
    if (query.teacherId) await assertTeacher(schoolId, query.teacherId);

    return prisma.timetableSlot.findMany({
      where: {
        schoolId,
        ...(query.sectionId ? { sectionId: query.sectionId } : {}),
        ...(query.teacherId ? { teacherId: query.teacherId } : {}),
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      include: slotInclude,
    });
  },

  async update(schoolId: string, id: string, input: UpdateSlotInput) {
    const existing = await assertSlot(schoolId, id);
    if (input.subjectId) await assertSubject(schoolId, input.subjectId);
    if (input.teacherId) await assertTeacher(schoolId, input.teacherId);

    const merged: SlotWindow = {
      sectionId: existing.sectionId,
      dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
      startMinute: input.startMinute ?? existing.startMinute,
      endMinute: input.endMinute ?? existing.endMinute,
      teacherId: 'teacherId' in input ? input.teacherId : existing.teacherId,
      room: 'room' in input ? input.room : existing.room,
    };
    if (merged.startMinute >= merged.endMinute) {
      throw ApiError.badRequest('startMinute must be before endMinute');
    }
    await assertNoConflicts(schoolId, merged, id);

    return prisma.timetableSlot.update({ where: { id }, data: input, include: slotInclude });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertSlot(schoolId, id);
    await prisma.timetableSlot.delete({ where: { id } });
  },
};
