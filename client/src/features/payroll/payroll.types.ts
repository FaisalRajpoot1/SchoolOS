import type { PaginationMeta } from '@/features/schools/schools.types';

export type PayslipStatus = 'DRAFT' | 'PAID';

export interface Payslip {
  id: string;
  periodMonth: number;
  periodYear: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: PayslipStatus;
  paidAt: string | null;
  note: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string };
}

export interface CreatePayslipPayload {
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  basicSalary?: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
  tax?: number;
  note?: string;
}

export interface UpdatePayslipPayload {
  basicSalary?: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
  tax?: number;
  note?: string;
}

export interface ListPayslipsParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  periodMonth?: number;
  periodYear?: number;
  status?: PayslipStatus;
}

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export type { PaginationMeta };
