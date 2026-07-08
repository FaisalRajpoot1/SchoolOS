import { type InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { notificationsService } from '@/features/notifications/notifications.service';
import type {
  AddPaymentInput,
  ApplyLateFeesInput,
  CreateInvoiceInput,
  ListInvoicesQuery,
  SetInstallmentsInput,
  UpdateInvoiceInput,
} from './invoices.validation';
import { buildInvoicePdf } from './invoice.pdf';
import { allocateInstallments, scheduledTotal } from './installments';

interface Totals {
  subtotal: number;
  discount: number;
  lateFee: number;
  total: number;
  paid: number;
  balance: number;
}

const sumItems = (items: { amount: number; quantity: number }[]): number =>
  items.reduce((acc, i) => acc + i.amount * i.quantity, 0);

const sumPayments = (payments: { amount: number }[]): number =>
  payments.reduce((acc, p) => acc + p.amount, 0);

/** Net amount owed: subtotal less discount (floored at 0), plus any late fee. */
const netTotal = (subtotal: number, discount: number, lateFee: number): number =>
  Math.max(0, subtotal - discount) + lateFee;

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
      discount: true,
      lateFee: true,
      items: { select: { amount: true, quantity: true } },
      payments: { select: { amount: true } },
    },
  });
  if (!invoice) return;
  const total = netTotal(sumItems(invoice.items), invoice.discount, invoice.lateFee);
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

const withTotals = <
  T extends {
    discount: number;
    lateFee: number;
    items: { amount: number; quantity: number }[];
    payments: { amount: number }[];
  },
>(
  invoice: T,
): T & { totals: Totals } => {
  const subtotal = sumItems(invoice.items);
  const total = netTotal(subtotal, invoice.discount, invoice.lateFee);
  const paid = sumPayments(invoice.payments);
  return {
    ...invoice,
    totals: {
      subtotal,
      discount: invoice.discount,
      lateFee: invoice.lateFee,
      total,
      paid,
      balance: total - paid,
    },
  };
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
          discount: input.discount,
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

      const withNet = withTotals(invoice);
      await notificationsService.notifyGuardiansSafe(schoolId, [input.studentId], {
        type: 'FEE',
        title: `New invoice ${invoice.invoiceNo}`,
        body: `${invoice.title} — total ${withNet.totals.total}.`,
      });

      return withNet;
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
    if (input.amount > invoice.totals.balance) {
      throw ApiError.badRequest('Payment exceeds the outstanding balance');
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

    const updated = await this.getById(schoolId, invoiceId);
    await notificationsService.notifyGuardiansSafe(schoolId, [updated.studentId], {
      type: 'FEE',
      title: 'Payment received',
      body: `Payment of ${input.amount} recorded for invoice ${updated.invoiceNo}. Balance ${updated.totals.balance}.`,
    });
    return updated;
  },

  /**
   * Bulk-applies a flat late fee to every overdue, still-owing invoice that
   * doesn't already carry one. "Overdue" means the due date is on or before
   * `asOf` minus `graceDays`. Idempotent: invoices with a late fee are skipped.
   */
  async applyLateFees(schoolId: string, input: ApplyLateFeesInput) {
    const asOf = input.asOf ?? new Date();
    const cutoff = new Date(asOf.getTime() - input.graceDays * 24 * 60 * 60 * 1000);

    // Select and charge inside one transaction so a concurrent payment can't slip
    // between the candidate read and the update.
    const applied = await prisma.$transaction(async (tx) => {
      const candidates = await tx.invoice.findMany({
        where: {
          schoolId,
          status: { in: ['PENDING', 'PARTIAL'] },
          lateFee: 0,
          dueDate: { lte: cutoff },
        },
        select: { id: true },
      });
      if (candidates.length === 0) return 0;

      const ids = candidates.map((c) => c.id);
      await tx.invoice.updateMany({
        where: { id: { in: ids }, schoolId },
        data: { lateFee: input.amount },
      });
      // A late fee only raises the balance, so status stays PENDING/PARTIAL;
      // recompute anyway so the derived status is always consistent.
      for (const id of ids) {
        await recomputeStatus(tx, id);
      }
      return ids.length;
    });
    return { applied, amount: input.amount };
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

  /** Returns the invoice's installment plan with each installment's derived status. */
  async getInstallments(schoolId: string, invoiceId: string) {
    const invoice = await this.getById(schoolId, invoiceId);
    const installments = await prisma.invoiceInstallment.findMany({
      where: { invoiceId, schoolId },
      orderBy: { seq: 'asc' },
    });
    const allocated = allocateInstallments(
      installments.map((i) => ({ seq: i.seq, label: i.label, dueDate: i.dueDate, amount: i.amount })),
      invoice.totals.paid,
      new Date(),
    );
    const scheduled = scheduledTotal(installments);
    return {
      installments: allocated,
      summary: {
        total: invoice.totals.total,
        paid: invoice.totals.paid,
        scheduled,
        matchesTotal: scheduled === invoice.totals.total,
      },
    };
  },

  /**
   * Replaces the invoice's installment plan. The installment amounts must sum
   * to the invoice's net total; `seq` is assigned from the submitted order.
   */
  async setInstallments(schoolId: string, invoiceId: string, input: SetInstallmentsInput) {
    const invoice = await this.getById(schoolId, invoiceId);
    if (invoice.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot set an installment plan on a cancelled invoice');
    }
    const scheduled = input.installments.reduce((acc, i) => acc + i.amount, 0);
    if (scheduled !== invoice.totals.total) {
      throw ApiError.badRequest(
        `Installments must sum to the net total (${invoice.totals.total}); got ${scheduled}`,
      );
    }
    await prisma.$transaction(async (tx) => {
      await tx.invoiceInstallment.deleteMany({ where: { invoiceId, schoolId } });
      await tx.invoiceInstallment.createMany({
        data: input.installments.map((inst, idx) => ({
          schoolId,
          invoiceId,
          seq: idx + 1,
          label: inst.label ?? null,
          dueDate: inst.dueDate,
          amount: inst.amount,
        })),
      });
    });
    return this.getInstallments(schoolId, invoiceId);
  },

  /** Removes the invoice's installment plan entirely. */
  async clearInstallments(schoolId: string, invoiceId: string) {
    await this.getById(schoolId, invoiceId);
    await prisma.invoiceInstallment.deleteMany({ where: { invoiceId, schoolId } });
    return this.getInstallments(schoolId, invoiceId);
  },

  /** Renders an invoice as a PDF buffer with a suggested filename. */
  async renderPdf(schoolId: string, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const [invoice, school] = await Promise.all([
      this.getById(schoolId, id),
      prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    ]);

    const buffer = await buildInvoicePdf({
      schoolName: school?.name ?? 'School',
      invoiceNo: invoice.invoiceNo,
      title: invoice.title,
      status: invoice.status,
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
      studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
      admissionNo: invoice.student.admissionNo,
      items: invoice.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        amount: it.amount,
      })),
      payments: invoice.payments.map((p) => ({
        paidAt: p.paidAt.toISOString().slice(0, 10),
        method: p.method,
        amount: p.amount,
        reference: p.reference,
      })),
      totals: invoice.totals,
    });
    return { buffer, filename: `invoice-${invoice.invoiceNo}.pdf` };
  },
};
