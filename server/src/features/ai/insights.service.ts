import { prisma } from '@/db/prisma';

const ATTENDANCE_WINDOW_DAYS = 30;
const ATTENDANCE_MIN_MARKED = 5;
const ATTENDANCE_RISK_RATE = 75;
const PERFORMANCE_FAIL_THRESHOLD = 2;

interface Reason {
  type: 'ATTENDANCE' | 'PERFORMANCE' | 'FEES';
  detail: string;
}

interface RiskStudent {
  studentId: string;
  name: string;
  admissionNo: string;
  className: string;
  riskScore: number;
  reasons: Reason[];
}

/**
 * Rules-based early-warning engine. Flags active students who are at risk on
 * attendance, exam performance, or unpaid fees — computed entirely from
 * existing data, so it always works without any AI provider configured.
 */
export const insightsService = {
  async atRisk(schoolId: string) {
    const since = new Date(Date.now() - ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [students, attendance, marks, invoices] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, status: 'ACTIVE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          class: { select: { name: true } },
        },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { schoolId, date: { gte: since } },
        _count: { _all: true },
      }),
      prisma.mark.findMany({
        where: { student: { schoolId }, marksObtained: { not: null } },
        select: { studentId: true, marksObtained: true, examSubject: { select: { passMarks: true } } },
      }),
      prisma.invoice.findMany({
        where: { schoolId, status: { not: 'CANCELLED' } },
        select: { studentId: true, total: true, payments: { select: { amount: true } } },
      }),
    ]);

    // Attendance: present-rate per student over the window.
    const att = new Map<string, { present: number; marked: number }>();
    for (const row of attendance) {
      const entry = att.get(row.studentId) ?? { present: 0, marked: 0 };
      entry.marked += row._count._all;
      if (row.status === 'PRESENT') entry.present += row._count._all;
      att.set(row.studentId, entry);
    }

    // Performance: failed-subject count per student.
    const fails = new Map<string, number>();
    for (const m of marks) {
      if (m.marksObtained !== null && m.marksObtained < m.examSubject.passMarks) {
        fails.set(m.studentId, (fails.get(m.studentId) ?? 0) + 1);
      }
    }

    // Fees: outstanding balance per student.
    const balance = new Map<string, number>();
    for (const inv of invoices) {
      const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
      balance.set(inv.studentId, (balance.get(inv.studentId) ?? 0) + (inv.total - paid));
    }

    const flagged: RiskStudent[] = [];
    for (const s of students) {
      const reasons: Reason[] = [];
      let riskScore = 0;

      const a = att.get(s.id);
      if (a && a.marked >= ATTENDANCE_MIN_MARKED) {
        const rate = Math.round((a.present / a.marked) * 100);
        if (rate < ATTENDANCE_RISK_RATE) {
          reasons.push({ type: 'ATTENDANCE', detail: `Attendance ${rate}% over last ${ATTENDANCE_WINDOW_DAYS} days` });
          riskScore += ATTENDANCE_RISK_RATE - rate;
        }
      }

      const failCount = fails.get(s.id) ?? 0;
      if (failCount >= PERFORMANCE_FAIL_THRESHOLD) {
        reasons.push({ type: 'PERFORMANCE', detail: `Failed ${failCount} exam subjects` });
        riskScore += failCount * 10;
      }

      const bal = balance.get(s.id) ?? 0;
      if (bal > 0) {
        reasons.push({ type: 'FEES', detail: `Outstanding fees` });
        riskScore += Math.min(30, Math.round(bal / 100));
      }

      if (reasons.length > 0) {
        flagged.push({
          studentId: s.id,
          name: `${s.firstName} ${s.lastName}`,
          admissionNo: s.admissionNo,
          className: s.class?.name ?? 'Unassigned',
          riskScore,
          reasons,
        });
      }
    }

    flagged.sort((a, b) => b.riskScore - a.riskScore);

    return {
      summary: {
        totalFlagged: flagged.length,
        attendanceRisk: flagged.filter((s) => s.reasons.some((r) => r.type === 'ATTENDANCE')).length,
        performanceRisk: flagged.filter((s) => s.reasons.some((r) => r.type === 'PERFORMANCE')).length,
        feeRisk: flagged.filter((s) => s.reasons.some((r) => r.type === 'FEES')).length,
      },
      students: flagged.slice(0, 25),
    };
  },
};
