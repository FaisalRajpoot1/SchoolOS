import { type AttendanceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type { BulkMarkInput, StudentHistoryQuery } from './attendance.validation';

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
  async roster(schoolId: string, sectionId: string, date: Date): Promise<RosterEntry[]> {
    await assertSection(schoolId, sectionId);
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
  async bulkMark(
    schoolId: string,
    recordedById: string,
    input: BulkMarkInput,
  ): Promise<RosterEntry[]> {
    await assertSection(schoolId, input.sectionId);
    const day = toDateOnly(input.date);

    // Only allow marking students currently enrolled in this section.
    const enrolled = await prisma.student.findMany({
      where: { schoolId, sectionId: input.sectionId },
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

    return this.roster(schoolId, input.sectionId, day);
  },

  /** A student's attendance records over a range, with per-status counts. */
  async studentHistory(schoolId: string, studentId: string, query: StudentHistoryQuery) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, firstName: true, lastName: true, admissionNo: true },
    });
    if (!student) throw ApiError.notFound('Student not found');

    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) dateFilter.gte = toDateOnly(query.from);
    if (query.to) dateFilter.lte = toDateOnly(query.to);
    const where: Prisma.AttendanceRecordWhereInput = {
      studentId,
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
};
