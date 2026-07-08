import { type AttendanceStatus, type Gender, type InvoiceStatus, Prisma, type StudentStatus } from '@prisma/client';
import { prisma } from '@/db/prisma';
import type { AttendanceRange, FinanceRange } from './reports.validation';

/** Net owed for an invoice aggregate: total − discount + late fee. */
const netInvoiced = (agg: {
  _sum: { total: number | null; discount: number | null; lateFee: number | null };
}): number => (agg._sum.total ?? 0) - (agg._sum.discount ?? 0) + (agg._sum.lateFee ?? 0);

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

  /**
   * Finance totals, invoices by status, and the top outstanding balances.
   *
   * `invoiced`, `collected`, and `byStatus` reflect the selected window
   * (invoices by `createdAt`, payments by `paidAt`); when no range is given
   * they cover all time. `outstanding` and `topDefaulters` are always
   * point-in-time (current total owed across all non-cancelled invoices),
   * since "who owes money now" is inherently a current figure.
   */
  async finance(schoolId: string, range: FinanceRange) {
    const notCancelled = { not: 'CANCELLED' } as const;
    const hasRange = Boolean(range.from || range.to);
    // `to` arrives as midnight of that day; compare with an exclusive next-day
    // bound so the whole "to" day is included against the timestamp columns.
    const dateWindow = {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lt: new Date(range.to.getTime() + 24 * 60 * 60 * 1000) } : {}),
    };

    const [invoiceAgg, paymentAgg, byStatusRaw, currentOutstanding, defaulters] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true, discount: true, lateFee: true },
        where: { schoolId, status: notCancelled, ...(hasRange ? { createdAt: dateWindow } : {}) },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          schoolId,
          invoice: { status: notCancelled },
          ...(hasRange ? { paidAt: dateWindow } : {}),
        },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { schoolId, ...(hasRange ? { createdAt: dateWindow } : {}) },
        _count: { _all: true },
      }),
      // Current total outstanding across ALL non-cancelled invoices, independent
      // of the window. Only needs a second pair of aggregates when a range is set;
      // otherwise the windowed figures already cover all time.
      hasRange
        ? Promise.all([
            prisma.invoice.aggregate({
              _sum: { total: true, discount: true, lateFee: true },
              where: { schoolId, status: notCancelled },
            }),
            prisma.payment.aggregate({
              _sum: { amount: true },
              where: { schoolId, invoice: { status: notCancelled } },
            }),
          ])
        : null,
      // Per-student outstanding balance is aggregated in SQL (top 10 only), so
      // the report never loads every invoice/payment row into memory. Payments
      // are summed per invoice first to avoid a join fan-out inflating totals.
      prisma.$queryRaw<DefaulterRow[]>(Prisma.sql`
        SELECT i."studentId"       AS "studentId",
               s."firstName"       AS "firstName",
               s."lastName"        AS "lastName",
               s."admissionNo"     AS "admissionNo",
               (SUM(i.total) - SUM(i.discount) + SUM(i."lateFee") - COALESCE(SUM(p.paid), 0))::int AS balance
        FROM "invoices" i
        JOIN "students" s ON s.id = i."studentId"
        LEFT JOIN (
          SELECT "invoiceId", SUM(amount) AS paid FROM "payments" GROUP BY "invoiceId"
        ) p ON p."invoiceId" = i.id
        WHERE i."schoolId" = ${schoolId} AND i.status <> 'CANCELLED'::"InvoiceStatus"
        GROUP BY i."studentId", s."firstName", s."lastName", s."admissionNo"
        HAVING (SUM(i.total) - SUM(i.discount) + SUM(i."lateFee") - COALESCE(SUM(p.paid), 0)) > 0
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

    // Windowed figures (all-time when no range was supplied).
    const invoiced = netInvoiced(invoiceAgg);
    const collected = paymentAgg._sum.amount ?? 0;

    // Current outstanding: reuse the windowed figures when there is no range
    // (they already cover all time), else the dedicated all-time aggregates.
    const outstanding = currentOutstanding
      ? Math.max(0, netInvoiced(currentOutstanding[0]) - (currentOutstanding[1]._sum.amount ?? 0))
      : Math.max(0, invoiced - collected);

    return {
      from: range.from ? range.from.toISOString().slice(0, 10) : null,
      to: range.to ? range.to.toISOString().slice(0, 10) : null,
      invoiced,
      collected,
      outstanding,
      byStatus,
      topDefaulters,
    };
  },
};
