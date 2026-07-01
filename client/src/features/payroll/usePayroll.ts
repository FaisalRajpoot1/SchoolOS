import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from './payroll.api';
import type { CreatePayslipPayload, ListPayslipsParams, UpdatePayslipPayload } from './payroll.types';

const keys = {
  all: ['payroll'] as const,
  list: (params: ListPayslipsParams) => ['payroll', 'list', params] as const,
  detail: (id: string) => ['payroll', 'detail', id] as const,
};

export const usePayslips = (params: ListPayslipsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => payrollApi.list(params) });

export const usePayslip = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => payrollApi.getById(id), enabled: !!id });

export const useCreatePayslip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayslipPayload) => payrollApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useGeneratePayslips = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      payrollApi.generate(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

const syncDetail = (qc: ReturnType<typeof useQueryClient>, id: string) => (payslip: { id: string }) => {
  qc.setQueryData(keys.detail(id), payslip);
  void qc.invalidateQueries({ queryKey: keys.all });
};

export const useUpdatePayslip = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePayslipPayload) => payrollApi.update(id, payload),
    onSuccess: syncDetail(qc, id),
  });
};

export const usePayPayslip = (id: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => payrollApi.pay(id), onSuccess: syncDetail(qc, id) });
};

export const useDeletePayslip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
