import { api } from '@/lib/axios';
import type { AttendanceReport, FinanceReport, StudentsReport } from './reports.types';

export const reportsApi = {
  async students(): Promise<StudentsReport> {
    const { data } = await api.get<{ data: StudentsReport }>('/reports/students');
    return data.data;
  },
  async attendance(from?: string, to?: string): Promise<AttendanceReport> {
    const { data } = await api.get<{ data: AttendanceReport }>('/reports/attendance', {
      params: { from, to },
    });
    return data.data;
  },
  async finance(): Promise<FinanceReport> {
    const { data } = await api.get<{ data: FinanceReport }>('/reports/finance');
    return data.data;
  },
};
