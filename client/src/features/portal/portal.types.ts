import type { AttendanceStatus } from '@/features/attendance/attendance.types';
import type { InvoiceStatus } from '@/features/fees/fees.types';

interface NamedRef {
  id: string;
  name: string;
}

export interface PortalChild {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  status: string;
  relation: string | null;
  class: NamedRef | null;
  section: NamedRef | null;
}

export interface PortalMe {
  parent: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  children: PortalChild[];
}

export interface ChildAttendance {
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  counts: Record<AttendanceStatus, number>;
  records: { id: string; date: string; status: AttendanceStatus; remark: string | null }[];
}

export interface ChildInvoice {
  id: string;
  invoiceNo: string;
  title: string;
  status: InvoiceStatus;
  totals: { total: number; paid: number; balance: number };
}

export interface ChildHomework {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  subject: NamedRef | null;
  submission: {
    submittedAt: string;
    isLate: boolean;
    marks: number | null;
    feedback: string | null;
    gradedAt: string | null;
  } | null;
}

export interface ChildResult {
  examId: string;
  examName: string;
  obtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  passed: boolean;
  subjects: {
    subject: NamedRef;
    maxMarks: number;
    marksObtained: number | null;
    isAbsent: boolean;
    passed: boolean;
  }[];
}
