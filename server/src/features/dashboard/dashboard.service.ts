import type { AttendanceStatus, InvoiceStatus } from '@prisma/client';
import { prisma } from '@/db/prisma';

const toDateOnly = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export const dashboardService = {
  /** Aggregated KPIs for a school admin's overview. */
  async getOverview(schoolId: string) {
    const today = toDateOnly(new Date());

    const [
      studentsTotal,
      studentsActive,
      teachersTotal,
      teachersActive,
      classesCount,
      sectionsCount,
      attendanceGroups,
      invoiceAgg,
      paymentAgg,
      invoiceStatusGroups,
      recentInvoices,
    ] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      prisma.teacher.count({ where: { schoolId } }),
      prisma.teacher.count({ where: { schoolId, status: 'ACTIVE' } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.section.count({ where: { class: { schoolId } } }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { schoolId, date: today },
        _count: { status: true },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true, discount: true },
        where: { schoolId, status: { not: 'CANCELLED' } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { schoolId, invoice: { status: { not: 'CANCELLED' } } },
      }),
      prisma.invoice.groupBy({ by: ['status'], where: { schoolId }, _count: { status: true } }),
      prisma.invoice.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNo: true,
          title: true,
          status: true,
          total: true,
          student: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const attendance: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const g of attendanceGroups) attendance[g.status] = g._count.status;
    const marked = attendance.PRESENT + attendance.ABSENT + attendance.LATE + attendance.LEAVE;
    const rate = marked > 0 ? Math.round((attendance.PRESENT / marked) * 100) : 0;

    const byStatus: Record<InvoiceStatus, number> = { PENDING: 0, PARTIAL: 0, PAID: 0, CANCELLED: 0 };
    for (const g of invoiceStatusGroups) byStatus[g.status] = g._count.status;

    // Net of scholarships/discounts.
    const invoiced = (invoiceAgg._sum.total ?? 0) - (invoiceAgg._sum.discount ?? 0);
    const collected = paymentAgg._sum.amount ?? 0;

    return {
      students: { total: studentsTotal, active: studentsActive },
      teachers: { total: teachersTotal, active: teachersActive },
      classes: classesCount,
      sections: sectionsCount,
      attendanceToday: {
        date: today.toISOString().slice(0, 10),
        present: attendance.PRESENT,
        absent: attendance.ABSENT,
        late: attendance.LATE,
        leave: attendance.LEAVE,
        marked,
        activeStudents: studentsActive,
        rate,
      },
      finance: {
        invoiced,
        collected,
        outstanding: Math.max(0, invoiced - collected),
        byStatus,
      },
      recentInvoices,
    };
  },
};
