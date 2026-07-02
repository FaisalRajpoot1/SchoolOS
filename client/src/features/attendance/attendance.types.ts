export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

export interface RosterEntry {
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  status: AttendanceStatus | null;
  remark: string | null;
}

export interface BulkMarkRecord {
  studentId: string;
  status: AttendanceStatus;
  remark?: string | null;
}

export interface BulkMarkPayload {
  sectionId: string;
  date: string;
  records: BulkMarkRecord[];
}

export interface AttendanceSummaryRow {
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  present: number;
  absent: number;
  late: number;
  leave: number;
  marked: number;
  rate: number;
}

export interface AttendanceSummary {
  section: { id: string; name: string; class: { id: string; name: string } };
  month: number;
  year: number;
  rows: AttendanceSummaryRow[];
}
