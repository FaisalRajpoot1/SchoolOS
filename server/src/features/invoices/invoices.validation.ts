import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const money = z.coerce.number().int().min(-100_000_000).max(100_000_000);
const positiveMoney = z.coerce.number().int().min(1).max(100_000_000);
const invoiceStatus = z.enum(['PENDING', 'PARTIAL', 'PAID', 'CANCELLED']);
const paymentMethod = z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER']);

const invoiceItemSchema = z
  .object({
    categoryId: z.string().uuid().nullish(),
    description: z.string().trim().min(1).max(120),
    amount: money,
    quantity: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .strict();

export const createInvoiceSchema = z
  .object({
    studentId: z.string().uuid(),
    title: z.string().trim().min(1).max(120),
    dueDate: z.coerce.date().nullish(),
    notes: z.string().trim().max(500).nullish(),
    items: z.array(invoiceItemSchema).min(1).max(100),
    discount: z.coerce.number().int().min(0).max(100_000_000).default(0),
  })
  .strict()
  .refine((d) => d.discount <= d.items.reduce((acc, i) => acc + i.amount * i.quantity, 0), {
    message: 'Discount cannot exceed the invoice subtotal',
    path: ['discount'],
  });

export const updateInvoiceSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    dueDate: z.coerce.date().nullish(),
    notes: z.string().trim().max(500).nullish(),
  })
  .strict();

export const listInvoicesSchema = paginationSchema.extend({
  studentId: z.string().uuid().optional(),
  status: invoiceStatus.optional(),
});

export const addPaymentSchema = z
  .object({
    amount: positiveMoney,
    method: paymentMethod.default('CASH'),
    reference: z.string().trim().max(120).nullish(),
    note: z.string().trim().max(300).nullish(),
    paidAt: z.coerce.date().optional(),
  })
  .strict();

export const applyLateFeesSchema = z
  .object({
    amount: positiveMoney,
    graceDays: z.coerce.number().int().min(0).max(365).default(0),
    asOf: z.coerce.date().optional(),
  })
  .strict();

export const setInstallmentsSchema = z
  .object({
    installments: z
      .array(
        z
          .object({
            label: z.string().trim().max(60).nullish(),
            dueDate: z.coerce.date(),
            amount: positiveMoney,
          })
          .strict(),
      )
      .min(1)
      .max(60),
  })
  .strict();

export const invoiceIdParamSchema = z.object({ id: z.string().uuid() });
export const paymentIdParamSchema = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
export type SetInstallmentsInput = z.infer<typeof setInstallmentsSchema>;
export type ApplyLateFeesInput = z.infer<typeof applyLateFeesSchema>;
