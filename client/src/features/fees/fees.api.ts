import { api } from '@/lib/axios';
import { downloadFile } from '@/lib/download';
import type {
  AddPaymentPayload,
  ApplyLateFeesPayload,
  ApplyLateFeesResult,
  CreateInvoicePayload,
  FeeCategory,
  InstallmentPlan,
  InvoiceDetail,
  InvoiceListItem,
  ListInvoicesParams,
  PaginationMeta,
  SetInstallmentsPayload,
} from './fees.types';

export const feeCategoriesApi = {
  async list(): Promise<FeeCategory[]> {
    const { data } = await api.get<{ data: FeeCategory[] }>('/fee-categories');
    return data.data;
  },
  async create(payload: { name: string; description?: string }): Promise<FeeCategory> {
    const { data } = await api.post<{ data: { category: FeeCategory } }>('/fee-categories', payload);
    return data.data.category;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/fee-categories/${id}`);
  },
};

export const invoicesApi = {
  async list(
    params: ListInvoicesParams,
  ): Promise<{ items: InvoiceListItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: InvoiceListItem[]; meta: PaginationMeta }>('/invoices', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getById(id: string): Promise<InvoiceDetail> {
    const { data } = await api.get<{ data: { invoice: InvoiceDetail } }>(`/invoices/${id}`);
    return data.data.invoice;
  },
  async create(payload: CreateInvoicePayload): Promise<InvoiceDetail> {
    const { data } = await api.post<{ data: { invoice: InvoiceDetail } }>('/invoices', payload);
    return data.data.invoice;
  },
  async cancel(id: string): Promise<InvoiceDetail> {
    const { data } = await api.post<{ data: { invoice: InvoiceDetail } }>(`/invoices/${id}/cancel`);
    return data.data.invoice;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
  async addPayment(id: string, payload: AddPaymentPayload): Promise<InvoiceDetail> {
    const { data } = await api.post<{ data: { invoice: InvoiceDetail } }>(
      `/invoices/${id}/payments`,
      payload,
    );
    return data.data.invoice;
  },
  async removePayment(id: string, paymentId: string): Promise<InvoiceDetail> {
    const { data } = await api.delete<{ data: { invoice: InvoiceDetail } }>(
      `/invoices/${id}/payments/${paymentId}`,
    );
    return data.data.invoice;
  },
  downloadInvoicePdf(id: string, invoiceNo: string): Promise<void> {
    return downloadFile(`/invoices/${id}/pdf`, `invoice-${invoiceNo}.pdf`);
  },
  async getInstallments(id: string): Promise<InstallmentPlan> {
    const { data } = await api.get<{ data: InstallmentPlan }>(`/invoices/${id}/installments`);
    return data.data;
  },
  async setInstallments(id: string, payload: SetInstallmentsPayload): Promise<InstallmentPlan> {
    const { data } = await api.put<{ data: InstallmentPlan }>(`/invoices/${id}/installments`, payload);
    return data.data;
  },
  async clearInstallments(id: string): Promise<InstallmentPlan> {
    const { data } = await api.delete<{ data: InstallmentPlan }>(`/invoices/${id}/installments`);
    return data.data;
  },
  async applyLateFees(payload: ApplyLateFeesPayload): Promise<ApplyLateFeesResult> {
    const { data } = await api.post<{ data: ApplyLateFeesResult }>('/invoices/apply-late-fees', payload);
    return data.data;
  },
};
