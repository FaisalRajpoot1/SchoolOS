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
