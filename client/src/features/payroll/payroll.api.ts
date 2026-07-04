import { api } from '@/lib/axios';
import { downloadFile } from '@/lib/download';
import type {
  CreatePayslipPayload,
  ListPayslipsParams,
  PaginationMeta,
  Payslip,
  PayslipStatus,
  UpdatePayslipPayload,
} from './payroll.types';

export const payrollApi = {
  async list(params: ListPayslipsParams): Promise<{ items: Payslip[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: Payslip[]; meta: PaginationMeta }>('/payroll/payslips', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<Payslip> {
    const { data } = await api.get<{ data: { payslip: Payslip } }>(`/payroll/payslips/${id}`);
    return data.data.payslip;
  },
  async create(payload: CreatePayslipPayload): Promise<Payslip> {
    const { data } = await api.post<{ data: { payslip: Payslip } }>('/payroll/payslips', payload);
    return data.data.payslip;
  },
  async generate(periodMonth: number, periodYear: number): Promise<{ created: number }> {
    const { data } = await api.post<{ data: { created: number } }>('/payroll/payslips/generate', {
      periodMonth,
      periodYear,
    });
    return data.data;
  },
  async update(id: string, payload: UpdatePayslipPayload): Promise<Payslip> {
    const { data } = await api.patch<{ data: { payslip: Payslip } }>(`/payroll/payslips/${id}`, payload);
    return data.data.payslip;
  },
  async pay(id: string): Promise<Payslip> {
    const { data } = await api.post<{ data: { payslip: Payslip } }>(`/payroll/payslips/${id}/pay`);
    return data.data.payslip;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/payroll/payslips/${id}`);
  },
  downloadPdf(id: string): Promise<void> {
    return downloadFile(`/payroll/payslips/${id}/pdf`, `payslip-${id}.pdf`);
  },
  async register(periodMonth: number, periodYear: number): Promise<PayrollRegister> {
    const { data } = await api.get<{ data: PayrollRegister }>('/payroll/register', {
      params: { periodMonth, periodYear },
    });
    return data.data;
  },
  async ytd(periodYear: number): Promise<PayrollYtd> {
    const { data } = await api.get<{ data: PayrollYtd }>('/payroll/ytd', { params: { periodYear } });
    return data.data;
  },
  async getTaxSlabs(): Promise<TaxSlab[]> {
    const { data } = await api.get<{ data: { slabs: TaxSlab[] } }>('/payroll/tax-slabs');
    return data.data.slabs;
  },
  async setTaxSlabs(slabs: TaxSlab[]): Promise<TaxSlab[]> {
    const { data } = await api.put<{ data: { slabs: TaxSlab[] } }>('/payroll/tax-slabs', { slabs });
    return data.data.slabs;
  },
};

export interface TaxSlab {
  minMonthly: number;
  rate: number;
}

export interface YtdRow {
  employeeCode: string;
  name: string;
  payslips: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  tax: number;
  netPay: number;
}

export interface PayrollYtd {
  periodYear: number;
  rows: YtdRow[];
  totals: Omit<YtdRow, 'employeeCode' | 'name' | 'payslips'>;
}

export interface RegisterRow {
  employeeCode: string;
  name: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: PayslipStatus;
}

export interface PayrollRegister {
  periodMonth: number;
  periodYear: number;
  rows: RegisterRow[];
  totals: Omit<RegisterRow, 'employeeCode' | 'name' | 'status'>;
}
