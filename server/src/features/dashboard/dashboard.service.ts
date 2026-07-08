import type { AttendanceStatus, DayOfWeek, InvoiceStatus } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';

const toDateOnly = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** Maps a JS getUTCDay() index (0=Sun) to the schema's DayOfWeek enum. */
const DOW: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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
        _sum: { total: true, discount: true, lateFee: true },
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

    // Net of scholarships/discounts, plus any late fees.
    const invoiced =
      (invoiceAgg._sum.total ?? 0) -
      (invoiceAgg._sum.discount ?? 0) +
      (invoiceAgg._sum.lateFee ?? 0);
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

  /** At-a-glance overview for the signed-in teacher. */
  async getTeacherOverview(schoolId: string, userId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { schoolId, userId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!teacher) throw ApiError.badRequest('No teacher profile is linked to your account');

    const now = new Date();
    const today = toDateOnly(now);
    const dayOfWeek = DOW[now.getUTCDay()] ?? 'MON';

    const [sectionsCount, periods, pendingHomework, pendingAssignments, upcomingHomework] =
      await Promise.all([
        prisma.section.count({ where: { classTeacherId: teacher.id, class: { schoolId } } }),
        prisma.timetableSlot.findMany({
          where: { schoolId, teacherId: teacher.id, dayOfWeek },
          orderBy: { startMinute: 'asc' },
          select: {
            startMinute: true,
            endMinute: true,
            room: true,
            subject: { select: { name: true } },
            section: { select: { name: true, class: { select: { name: true } } } },
          },
        }),
        prisma.homeworkSubmission.count({
          where: { gradedAt: null, homework: { schoolId, teacherId: teacher.id } },
        }),
        prisma.assignmentSubmission.count({
          where: { gradedAt: null, assignment: { schoolId, teacherId: teacher.id } },
        }),
        prisma.homework.count({ where: { schoolId, teacherId: teacher.id, dueDate: { gte: today } } }),
      ]);

    return {
      teacher: { name: `${teacher.firstName} ${teacher.lastName}` },
      sections: sectionsCount,
      pendingGrading: pendingHomework + pendingAssignments,
      upcomingHomework,
      today: {
        dayOfWeek,
        periods: periods.map((p) => ({
          startMinute: p.startMinute,
          endMinute: p.endMinute,
          subject: p.subject?.name ?? null,
          section: p.section ? `${p.section.class.name} ${p.section.name}` : null,
          room: p.room,
        })),
      },
    };
  },
};
