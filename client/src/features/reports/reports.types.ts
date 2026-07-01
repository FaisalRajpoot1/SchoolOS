export interface StudentsReport {
  total: number;
  active: number;
  byStatus: Record<string, number>;
  byGender: Record<string, number>;
  byClass: { className: string; count: number }[];
}

export interface AttendanceReport {
  from: string;
  to: string;
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  LEAVE: number;
  marked: number;
  rate: number;
}

export interface FinanceReport {
  invoiced: number;
  collected: number;
  outstanding: number;
  byStatus: Record<string, number>;
  topDefaulters: { name: string; admissionNo: string; balance: number }[];
}
