import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

const money = z.coerce.number().int().min(0).max(100_000_000);
const month = z.coerce.number().int().min(1).max(12);
const year = z.coerce.number().int().min(2000).max(2100);

export const createPayslipSchema = z
  .object({
    employeeId: z.string().uuid(),
    periodMonth: month,
    periodYear: year,
    basicSalary: money.optional(),
    allowances: money.default(0),
    bonus: money.default(0),
    deductions: money.default(0),
    tax: money.default(0),
    note: z.string().trim().max(200).nullish(),
  })
  .strict();

export const generatePayslipsSchema = z
  .object({ periodMonth: month, periodYear: year })
  .strict();

export const updatePayslipSchema = z
  .object({
    basicSalary: money.optional(),
    allowances: money.optional(),
    bonus: money.optional(),
    deductions: money.optional(),
    tax: money.optional(),
    note: z.string().trim().max(200).nullish(),
  })
  .strict();

export const listPayslipsSchema = paginationSchema.extend({
  employeeId: z.string().uuid().optional(),
  periodMonth: month.optional(),
  periodYear: year.optional(),
  status: z.enum(['DRAFT', 'PAID']).optional(),
});

export const payslipIdParamSchema = z.object({ id: z.string().uuid() });

/** Full-period register (no pagination) for CSV export. */
export const registerQuerySchema = z.object({ periodMonth: month, periodYear: year });

const taxSlab = z.object({
  minMonthly: z.coerce.number().int().min(0).max(100_000_000),
  rate: z.coerce.number().int().min(0).max(100),
});

/** Replaces a school's progressive tax slabs (distinct floors). */
export const setTaxSlabsSchema = z
  .object({ slabs: z.array(taxSlab).max(20) })
  .strict()
  .superRefine((data, ctx) => {
    const floors = data.slabs.map((s) => s.minMonthly);
    if (new Set(floors).size !== floors.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each slab needs a distinct minimum monthly income',
        path: ['slabs'],
      });
    }
  });

export type SetTaxSlabsInput = z.infer<typeof setTaxSlabsSchema>;

export type CreatePayslipInput = z.infer<typeof createPayslipSchema>;
export type GeneratePayslipsInput = z.infer<typeof generatePayslipsSchema>;
export type UpdatePayslipInput = z.infer<typeof updatePayslipSchema>;
export type ListPayslipsQuery = z.infer<typeof listPayslipsSchema>;
export type RegisterQuery = z.infer<typeof registerQuerySchema>;
