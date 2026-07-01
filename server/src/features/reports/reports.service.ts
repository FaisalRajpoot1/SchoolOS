import type { AttendanceStatus, Gender, InvoiceStatus, StudentStatus } from '@prisma/client';
import { prisma } from '@/db/prisma';
import type { AttendanceRange } from './reports.validation';

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
    const [invoiceAgg, paymentAgg, byStatusRaw, invoices] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { schoolId, status: { not: 'CANCELLED' } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { schoolId, invoice: { status: { not: 'CANCELLED' } } },
      }),
      prisma.invoice.groupBy({ by: ['status'], where: { schoolId }, _count: { _all: true } }),
      prisma.invoice.findMany({
        where: { schoolId, status: { not: 'CANCELLED' } },
        select: {
          total: true,
          studentId: true,
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          payments: { select: { amount: true } },
        },
      }),
    ]);

    const byStatus = {} as Record<InvoiceStatus, number>;
    for (const r of byStatusRaw) byStatus[r.status] = r._count._all;

    // Aggregate per-student outstanding balances in memory (admin-run report).
    const perStudent = new Map<string, { name: string; admissionNo: string; balance: number }>();
    for (const inv of invoices) {
      const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
      const balance = inv.total - paid;
      const existing = perStudent.get(inv.studentId);
      if (existing) existing.balance += balance;
      else
        perStudent.set(inv.studentId, {
          name: `${inv.student.firstName} ${inv.student.lastName}`,
          admissionNo: inv.student.admissionNo,
          balance,
        });
    }

    const topDefaulters = [...perStudent.values()]
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    const invoiced = invoiceAgg._sum.total ?? 0;
    const collected = paymentAgg._sum.amount ?? 0;

    return {
      invoiced,
      collected,
      outstanding: invoiced - collected,
      byStatus,
      topDefaulters,
    };
  },
};
