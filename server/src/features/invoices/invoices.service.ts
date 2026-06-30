import { type InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  AddPaymentInput,
  CreateInvoiceInput,
  ListInvoicesQuery,
  UpdateInvoiceInput,
} from './invoices.validation';

interface Totals {
  total: number;
  paid: number;
  balance: number;
}

const sumItems = (items: { amount: number; quantity: number }[]): number =>
  items.reduce((acc, i) => acc + i.amount * i.quantity, 0);

const sumPayments = (payments: { amount: number }[]): number =>
  payments.reduce((acc, p) => acc + p.amount, 0);

/** Derives invoice status from totals (CANCELLED is sticky). */
const deriveStatus = (
  current: InvoiceStatus,
  total: number,
  paid: number,
): InvoiceStatus => {
  if (current === 'CANCELLED') return 'CANCELLED';
  if (paid <= 0) return 'PENDING';
  if (paid >= total) return 'PAID';
  return 'PARTIAL';
};

const teacherlessRecorder = { select: { id: true, firstName: true, lastName: true } } as const;

const detailInclude = {
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
  items: { include: { category: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
  payments: { include: { recordedBy: teacherlessRecorder }, orderBy: { paidAt: 'desc' } },
} satisfies Prisma.InvoiceInclude;

/** Recomputes and persists an invoice's status from its items and payments. */
const recomputeStatus = async (tx: Prisma.TransactionClient, invoiceId: string): Promise<void> => {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      status: true,
      items: { select: { amount: true, quantity: true } },
      payments: { select: { amount: true } },
    },
  });
  if (!invoice) return;
  const total = sumItems(invoice.items);
  const paid = sumPayments(invoice.payments);
  const status = deriveStatus(invoice.status, total, paid);
  if (status !== invoice.status) {
    await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
  }
};

const nextInvoiceNo = async (schoolId: string): Promise<string> => {
  const count = await prisma.invoice.count({ where: { schoolId } });
  return `INV-${String(count + 1).padStart(5, '0')}`;
};

const withTotals = <T extends { items: { amount: number; quantity: number }[]; payments: { amount: number }[] }>(
  invoice: T,
): T & { totals: Totals } => {
  const total = sumItems(invoice.items);
  const paid = sumPayments(invoice.payments);
  return { ...invoice, totals: { total, paid, balance: total - paid } };
};

export const invoicesService = {
  async create(schoolId: string, input: CreateInvoiceInput) {
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: { id: true },
    });
    if (!student) throw ApiError.badRequest('Invalid student for this school');

    const categoryIds = [...new Set(input.items.map((i) => i.categoryId).filter(Boolean))] as string[];
    if (categoryIds.length > 0) {
      const owned = await prisma.feeCategory.count({
        where: { schoolId, id: { in: categoryIds } },
      });
      if (owned !== categoryIds.length) {
        throw ApiError.badRequest('One or more fee categories are invalid');
      }
    }

    try {
      const invoice = await prisma.invoice.create({
        data: {
          schoolId,
          studentId: input.studentId,
          invoiceNo: await nextInvoiceNo(schoolId),
          title: input.title,
          dueDate: input.dueDate ?? null,
          notes: input.notes ?? null,
          total: input.items.reduce((acc, i) => acc + i.amount * i.quantity, 0),
          items: {
            create: input.items.map((i) => ({
              categoryId: i.categoryId ?? null,
              description: i.description,
              amount: i.amount,
              quantity: i.quantity,
            })),
          },
        },
        include: detailInclude,
      });
      return withTotals(invoice);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('Invoice number collision, please retry');
      }
      throw err;
    }
  },

  async list(
    schoolId: string,
    query: ListInvoicesQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.InvoiceWhereInput = {
      schoolId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNo: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          items: { select: { amount: true, quantity: true } },
          payments: { select: { amount: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { items: rows.map(withTotals), meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({ where: { id, schoolId }, include: detailInclude });
    if (!invoice) throw ApiError.notFound('Invoice not found');
    return withTotals(invoice);
  },

  async update(schoolId: string, id: string, input: UpdateInvoiceInput) {
    await this.getById(schoolId, id);
    await prisma.invoice.update({ where: { id }, data: input });
    return this.getById(schoolId, id);
  },

  async cancel(schoolId: string, id: string) {
    await this.getById(schoolId, id);
    await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
    return this.getById(schoolId, id);
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await this.getById(schoolId, id);
    await prisma.invoice.delete({ where: { id } });
  },

  async addPayment(schoolId: string, recordedById: string, invoiceId: string, input: AddPaymentInput) {
    const invoice = await this.getById(schoolId, invoiceId);
    if (invoice.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot record a payment on a cancelled invoice');
    }
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          schoolId,
          invoiceId,
          recordedById,
          amount: input.amount,
          method: input.method,
          reference: input.reference ?? null,
          note: input.note ?? null,
          ...(input.paidAt ? { paidAt: input.paidAt } : {}),
        },
      });
      await recomputeStatus(tx, invoiceId);
    });
    return this.getById(schoolId, invoiceId);
  },

  async removePayment(schoolId: string, invoiceId: string, paymentId: string) {
    await this.getById(schoolId, invoiceId);
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, invoiceId } });
    if (!payment) throw ApiError.notFound('Payment not found');
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: paymentId } });
      await recomputeStatus(tx, invoiceId);
    });
    return this.getById(schoolId, invoiceId);
  },
};
