import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feeCategoriesApi, invoicesApi } from './fees.api';
import type {
  AddPaymentPayload,
  ApplyLateFeesPayload,
  CreateInvoicePayload,
  InvoiceDetail,
  ListInvoicesParams,
  SetInstallmentsPayload,
} from './fees.types';

const categoryKeys = { all: ['fee-categories'] as const };
const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params: ListInvoicesParams) => ['invoices', 'list', params] as const,
  detail: (id: string) => ['invoices', 'detail', id] as const,
  installments: (id: string) => ['invoices', 'installments', id] as const,
};

// ---- Fee categories ----
export const useFeeCategories = () =>
  useQuery({ queryKey: categoryKeys.all, queryFn: feeCategoriesApi.list });

export const useCreateFeeCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => feeCategoriesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
};

export const useDeleteFeeCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feeCategoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
};

// ---- Invoices ----
export const useInvoices = (params: ListInvoicesParams) =>
  useQuery({ queryKey: invoiceKeys.list(params), queryFn: () => invoicesApi.list(params) });

export const useInvoice = (id: string) =>
  useQuery({ queryKey: invoiceKeys.detail(id), queryFn: () => invoicesApi.getById(id), enabled: !!id });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
};

/** Writes the refreshed invoice into the cache after a mutation. */
const syncDetail = (qc: ReturnType<typeof useQueryClient>) => (invoice: InvoiceDetail) => {
  qc.setQueryData(invoiceKeys.detail(invoice.id), invoice);
  void qc.invalidateQueries({ queryKey: invoiceKeys.all });
};

export const useCancelInvoice = (id: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => invoicesApi.cancel(id), onSuccess: syncDetail(qc) });
};

export const useAddPayment = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddPaymentPayload) => invoicesApi.addPayment(id, payload),
    onSuccess: syncDetail(qc),
  });
};

export const useRemovePayment = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => invoicesApi.removePayment(id, paymentId),
    onSuccess: syncDetail(qc),
  });
};

// ---- Installment plan ----
export const useInstallments = (id: string) =>
  useQuery({
    queryKey: invoiceKeys.installments(id),
    queryFn: () => invoicesApi.getInstallments(id),
    enabled: !!id,
  });

export const useSetInstallments = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetInstallmentsPayload) => invoicesApi.setInstallments(id, payload),
    onSuccess: (plan) => {
      qc.setQueryData(invoiceKeys.installments(id), plan);
      void qc.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useClearInstallments = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => invoicesApi.clearInstallments(id),
    onSuccess: (plan) => qc.setQueryData(invoiceKeys.installments(id), plan),
  });
};

export const useApplyLateFees = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLateFeesPayload) => invoicesApi.applyLateFees(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
};
