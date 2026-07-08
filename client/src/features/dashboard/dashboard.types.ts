import type { InvoiceStatus } from '@/features/fees/fees.types';

export interface DashboardOverview {
  students: { total: number; active: number };
  teachers: { total: number; active: number };
  classes: number;
  sections: number;
  attendanceToday: {
    date: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    marked: number;
    activeStudents: number;
    rate: number;
  };
  finance: {
    invoiced: number;
    collected: number;
    outstanding: number;
    byStatus: Record<InvoiceStatus, number>;
  };
  recentInvoices: {
    id: string;
    invoiceNo: string;
    title: string;
    status: InvoiceStatus;
    total: number;
    student: { firstName: string; lastName: string };
  }[];
}

export interface TeacherPeriod {
  startMinute: number;
  endMinute: number;
  subject: string | null;
  section: string | null;
  room: string | null;
}

export interface TeacherOverview {
  teacher: { name: string };
  sections: number;
  pendingGrading: number;
  upcomingHomework: number;
  today: {
    dayOfWeek: string;
    periods: TeacherPeriod[];
  };
}

export interface AccountantOverview {
  finance: {
    invoiced: number;
    collected: number;
    outstanding: number;
    collectedThisMonth: number;
  };
  counts: { overdue: number; pending: number; partial: number };
  recentPayments: {
    id: string;
    amount: number;
    method: string;
    paidAt: string;
    invoiceNo: string;
    studentName: string;
  }[];
}
