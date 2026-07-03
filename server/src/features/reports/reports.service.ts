import { type AttendanceStatus, type Gender, type InvoiceStatus, Prisma, type StudentStatus } from '@prisma/client';
import { prisma } from '@/db/prisma';
import type { AttendanceRange } from './reports.validation';

interface DefaulterRow {
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  balance: number;
}

const toDateOnly = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export const reportsService = {
  /** Student headcounts by status, gender, and class. */
  async students(schoolId: string) {
    const [total, byStatusRaw, byGenderRaw, byClassRaw, classes] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.student.groupBy({ by: ['status'], where: { schoolId }, _count: { _all: true } }),
      prisma.student.groupBy({ by: ['gender'], where: { schoolId }, _count: { _all: true } }),
      prisma.student.groupBy({ by: ['classId'], where: { schoolId }, _count: { _all: true } }),
      prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true } }),
    ]);

    const byStatus = {} as Record<StudentStatus, number>;
    for (const r of byStatusRaw) byStatus[r.status] = r._count._all;

    const byGender: Record<string, number> = { MALE: 0, FEMALE: 0, OTHER: 0, UNSPECIFIED: 0 };
    for (const r of byGenderRaw) {
      byGender[(r.gender as Gender | null) ?? 'UNSPECIFIED'] = r._count._all;
    }

    const classNames = new Map(classes.map((c) => [c.id, c.name]));
    const byClass = byClassRaw
      .map((r) => ({
        className: r.classId ? (classNames.get(r.classId) ?? 'Unknown') : 'Unassigned',
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      active: byStatus.ACTIVE ?? 0,
      byStatus,
      byGender,
      byClass,
    };
  },

  /** Attendance totals across a date range (defaults to the last 30 days). */
  async attendance(schoolId: string, range: AttendanceRange) {
    const to = range.to ?? new Date();
    const from = range.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const grouped = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { schoolId, date: { gte: toDateOnly(from), lte: toDateOnly(to) } },
      _count: { _all: true },
    });

    const counts: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const g of grouped) counts[g.status] = g._count._all;
    const marked = counts.PRESENT + counts.ABSENT + counts.LATE + counts.LEAVE;

    return {
      from: toDateOnly(from).toISOString().slice(0, 10),
      to: toDateOnly(to).toISOString().slice(0, 10),
      ...counts,
      marked,
      rate: marked > 0 ? Math.round((counts.PRESENT / marked) * 100) : 0,
    };
  },

  /** Finance totals, invoices by status, and the top outstanding balances. */
  async finance(schoolId: string) {
    const [invoiceAgg, paymentAgg, byStatusRaw, defaulters] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { schoolId, status: { not: 'CANCELLED' } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { schoolId, invoice: { status: { not: 'CANCELLED' } } },
      }),
      prisma.invoice.groupBy({ by: ['status'], where: { schoolId }, _count: { _all: true } }),
      // Per-student outstanding balance is aggregated in SQL (top 10 only), so
      // the report never loads every invoice/payment row into memory. Payments
      // are summed per invoice first to avoid a join fan-out inflating totals.
      prisma.$queryRaw<DefaulterRow[]>(Prisma.sql`
        SELECT i."studentId"       AS "studentId",
               s."firstName"       AS "firstName",
               s."lastName"        AS "lastName",
               s."admissionNo"     AS "admissionNo",
               (SUM(i.total) - COALESCE(SUM(p.paid), 0))::int AS balance
        FROM "invoices" i
        JOIN "students" s ON s.id = i."studentId"
        LEFT JOIN (
          SELECT "invoiceId", SUM(amount) AS paid FROM "payments" GROUP BY "invoiceId"
        ) p ON p."invoiceId" = i.id
        WHERE i."schoolId" = ${schoolId} AND i.status <> 'CANCELLED'::"InvoiceStatus"
        GROUP BY i."studentId", s."firstName", s."lastName", s."admissionNo"
        HAVING (SUM(i.total) - COALESCE(SUM(p.paid), 0)) > 0
        ORDER BY balance DESC
        LIMIT 10
      `),
    ]);

    const byStatus = {} as Record<InvoiceStatus, number>;
    for (const r of byStatusRaw) byStatus[r.status] = r._count._all;

    const topDefaulters = defaulters.map((d) => ({
      name: `${d.firstName} ${d.lastName}`,
      admissionNo: d.admissionNo,
      balance: d.balance,
    }));

    const invoiced = invoiceAgg._sum.total ?? 0;
    const collected = paymentAgg._sum.amount ?? 0;

    return {
      invoiced,
      collected,
      outstanding: Math.max(0, invoiced - collected),
      byStatus,
      topDefaulters,
    };
  },
};
