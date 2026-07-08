import { useQuery } from '@tanstack/react-query';
import { reportsApi } from './reports.api';

export const useStudentsReport = () =>
  useQuery({ queryKey: ['reports', 'students'], queryFn: reportsApi.students });

export const useAttendanceReport = (from?: string, to?: string) =>
  useQuery({ queryKey: ['reports', 'attendance', from, to], queryFn: () => reportsApi.attendance(from, to) });

export const useFinanceReport = (from?: string, to?: string) =>
  useQuery({ queryKey: ['reports', 'finance', from, to], queryFn: () => reportsApi.finance(from, to) });
