import type { PaginationMeta } from '@/features/schools/schools.types';

export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';

export const INVOICE_STATUSES: InvoiceStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'];
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'];

export interface FeeCategory {
  id: string;
  name: string;
  description: string | null;
}

interface StudentRef {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  category: { id: string; name: string } | null;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  paidAt: string;
  recordedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface InvoiceListItem {
  id: string;
  invoiceNo: string;
  title: string;
  status: InvoiceStatus;
  dueDate: string | null;
  student: StudentRef;
  totals: InvoiceTotals;
}

export interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  title: string;
  status: InvoiceStatus;
  dueDate: string | null;
  notes: string | null;
  student: StudentRef;
  items: InvoiceItem[];
  payments: Payment[];
  totals: InvoiceTotals;
}

export interface CreateInvoiceItemPayload {
  categoryId?: string;
  description: string;
  amount: number;
  quantity: number;
}

export interface CreateInvoicePayload {
  studentId: string;
  title: string;
  dueDate?: string;
  notes?: string;
  items: CreateInvoiceItemPayload[];
  discount?: number;
}

export interface AddPaymentPayload {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt?: string;
}

export interface ListInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  studentId?: string;
}

export type { PaginationMeta };
