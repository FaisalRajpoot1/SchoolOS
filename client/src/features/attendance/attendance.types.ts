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
