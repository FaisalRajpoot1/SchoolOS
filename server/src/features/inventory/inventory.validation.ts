import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';

// ---- Suppliers ----
export const createSupplierSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    contactPerson: z.string().trim().max(80).nullish(),
    phone: z.string().trim().max(30).nullish(),
    email: z.string().email().nullish(),
  })
  .strict();

export const updateSupplierSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    contactPerson: z.string().trim().max(80).nullish(),
    phone: z.string().trim().max(30).nullish(),
    email: z.string().email().nullish(),
  })
  .strict();

export const supplierIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Items ----
export const createItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().max(60).nullish(),
    unit: z.string().trim().max(20).nullish(),
    quantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
    reorderLevel: z.coerce.number().int().min(0).max(1_000_000).nullish(),
    supplierId: z.string().uuid().nullish(),
  })
  .strict();

export const updateItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().max(60).nullish(),
    unit: z.string().trim().max(20).nullish(),
    reorderLevel: z.coerce.number().int().min(0).max(1_000_000).nullish(),
    supplierId: z.string().uuid().nullish(),
  })
  .strict();

export const listItemsSchema = paginationSchema.extend({
  supplierId: z.string().uuid().optional(),
  lowStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const itemIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Stock movements ----
export const stockTxnSchema = z
  .object({
    type: z.enum(['IN', 'OUT']),
    quantity: z.coerce.number().int().min(1).max(1_000_000),
    unitCost: z.coerce.number().int().min(0).max(100_000_000).nullish(),
    note: z.string().trim().max(200).nullish(),
    supplierId: z.string().uuid().nullish(),
  })
  .strict();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsQuery = z.infer<typeof listItemsSchema>;
export type StockTxnInput = z.infer<typeof stockTxnSchema>;
