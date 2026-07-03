import { type AttendanceStatus, Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { notificationsService } from '@/features/notifications/notifications.service';
import { logger } from '@/utils/logger';
import type { BulkMarkInput, StudentHistoryQuery, SummaryQuery } from './attendance.validation';

type Actor = { id: string; role: UserRole };

/**
 * Notifies each absent student's guardians. Fully best-effort — the whole body
 * is guarded so a notification failure can never affect the (already-committed)
 * attendance save. Bounded by section size (records are enrollment-checked).
 */
const notifyAbsences = async (
  schoolId: string,
  day: Date,
  records: BulkMarkInput['records'],
): Promise<void> => {
  try {
    const absentIds = records.filter((r) => r.status === 'ABSENT').map((r) => r.studentId);
    if (absentIds.length === 0) return;

    const students = await prisma.student.findMany({
      where: { id: { in: absentIds }, schoolId },
      select: { id: true, firstName: true, lastName: true },
    });
    const dateStr = day.toISOString().slice(0, 10);
    await Promise.all(
      students.map((s) =>
        notificationsService.notifyGuardiansSafe(schoolId, [s.id], {
          type: 'ATTENDANCE',
          title: 'Absence recorded',
          body: `${s.firstName} ${s.lastName} was marked absent on ${dateStr}.`,
        }),
      ),
    );
  } catch (err) {
    logger.error({ err, schoolId }, 'Failed to notify absences');
  }
};

/**
 * For a TEACHER, require they teach the section — either as its class teacher
 * or as a subject teacher of the section's class. Other roles (SCHOOL_ADMIN)
 * are unrestricted. Throws 403 otherwise.
 */
const assertSectionAccess = async (schoolId: string, actor: Actor, sectionId: string): Promise<void> => {
  if (actor.role !== 'TEACHER') return;
  const teacher = await prisma.teacher.findFirst({
    where: { schoolId, userId: actor.id },
    select: { id: true },
  });
  if (!teacher) throw ApiError.forbidden('No teacher profile for this account');
  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      class: { schoolId },
      OR: [
        { classTeacherId: teacher.id },
        { class: { classSubjects: { some: { teacherId: teacher.id } } } },
      ],
    },
    select: { id: true },
  });
  if (!section) throw ApiError.forbidden('You are not assigned to this section');
};

/** Normalizes a timestamp to a UTC date-only value (matches the @db.Date column). */
const toDateOnly = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** Loads a section within the tenant (via its class) or throws 404. */
const assertSection = async (schoolId: string, sectionId: string) => {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, class: { schoolId } },
    select: { id: true, name: true, class: { select: { id: true, name: true } } },
  });
  if (!section) throw ApiError.notFound('Section not found');
  return section;
};

export interface RosterEntry {
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  status: AttendanceStatus | null;
  remark: string | null;
}

export const attendanceService = {
  /** Active students in a section plus their recorded status for the given date. */
  async roster(schoolId: string, actor: Actor, sectionId: string, date: Date): Promise<RosterEntry[]> {
    await assertSection(schoolId, sectionId);
    await assertSectionAccess(schoolId, actor, sectionId);
    const day = toDateOnly(date);

    const [students, records] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, sectionId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.attendanceRecord.findMany({
        where: { sectionId, date: day },
        select: { studentId: true, status: true, remark: true },
      }),
    ]);

    const byStudent = new Map(records.map((r) => [r.studentId, r]));
    return students.map((student) => {
      const record = byStudent.get(student.id);
      return { student, status: record?.status ?? null, remark: record?.remark ?? null };
    });
  },

  /** Upserts attendance for a section/date. Returns the refreshed roster. */
  async bulkMark(schoolId: string, actor: Actor, input: BulkMarkInput): Promise<RosterEntry[]> {
    await assertSection(schoolId, input.sectionId);
    await assertSectionAccess(schoolId, actor, input.sectionId);
    const recordedById = actor.id;
    const day = toDateOnly(input.date);

    // Only allow marking students actively enrolled in this section (matches the roster).
    const enrolled = await prisma.student.findMany({
      where: { schoolId, sectionId: input.sectionId, status: 'ACTIVE' },
      select: { id: true },
    });
    const enrolledIds = new Set(enrolled.map((s) => s.id));
    const invalid = input.records.find((r) => !enrolledIds.has(r.studentId));
    if (invalid) {
      throw ApiError.badRequest('One or more students are not enrolled in this section');
    }

    await prisma.$transaction(
      input.records.map((r) =>
        prisma.attendanceRecord.upsert({
          where: { studentId_date: { studentId: r.studentId, date: day } },
          update: {
            status: r.status,
            remark: r.remark ?? null,
            sectionId: input.sectionId,
            recordedById,
          },
          create: {
            schoolId,
            studentId: r.studentId,
            sectionId: input.sectionId,
            date: day,
            status: r.status,
            remark: r.remark ?? null,
            recordedById,
          },
        }),
      ),
    );

    await notifyAbsences(schoolId, day, input.records);

    return this.roster(schoolId, actor, input.sectionId, day);
  },

  /** A student's attendance records over a range, with per-status counts. */
  async studentHistory(
    schoolId: string,
    actor: Actor,
    studentId: string,
    query: StudentHistoryQuery,
  ) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, firstName: true, lastName: true, admissionNo: true, sectionId: true },
    });
    if (!student) throw ApiError.notFound('Student not found');
    // A teacher may only view history for a student in a section they teach.
    if (actor.role === 'TEACHER') {
      if (!student.sectionId) throw ApiError.forbidden('You are not assigned to this student');
      await assertSectionAccess(schoolId, actor, student.sectionId);
    }

    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) dateFilter.gte = toDateOnly(query.from);
    if (query.to) dateFilter.lte = toDateOnly(query.to);
    const where: Prisma.AttendanceRecordWhereInput = {
      studentId,
      schoolId,
      ...(query.from || query.to ? { date: dateFilter } : {}),
    };

    const [records, grouped] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        select: { id: true, date: true, status: true, remark: true },
        orderBy: { date: 'desc' },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      LEAVE: 0,
    };
    for (const g of grouped) counts[g.status] = g._count.status;

    return { student, counts, records };
  },

  /** Per-student attendance totals for a section over a calendar month. */
  async summary(schoolId: string, actor: Actor, query: SummaryQuery) {
    const section = await assertSection(schoolId, query.sectionId);
    await assertSectionAccess(schoolId, actor, query.sectionId);

    const from = toDateOnly(new Date(Date.UTC(query.year, query.month - 1, 1)));
    const to = toDateOnly(new Date(Date.UTC(query.year, query.month, 1)));

    const [students, grouped] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, sectionId: query.sectionId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { schoolId, sectionId: query.sectionId, date: { gte: from, lt: to } },
        _count: { _all: true },
      }),
    ]);

    const byStudent = new Map<string, Record<AttendanceStatus, number>>();
    for (const g of grouped) {
      const entry =
        byStudent.get(g.studentId) ?? { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
      entry[g.status] = g._count._all;
      byStudent.set(g.studentId, entry);
    }

    const rows = students.map((student) => {
      const c = byStudent.get(student.id) ?? { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
      const marked = c.PRESENT + c.ABSENT + c.LATE + c.LEAVE;
      return {
        student,
        present: c.PRESENT,
        absent: c.ABSENT,
        late: c.LATE,
        leave: c.LEAVE,
        marked,
        rate: marked > 0 ? Math.round((c.PRESENT / marked) * 100) : 0,
      };
    });

    return { section, month: query.month, year: query.year, rows };
  },
};
