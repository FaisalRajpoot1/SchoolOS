import { type InventoryItem, Prisma, type Supplier } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreateItemInput,
  CreateSupplierInput,
  ListItemsQuery,
  StockTxnInput,
  UpdateItemInput,
  UpdateSupplierInput,
} from './inventory.validation';

const assertSupplier = async (schoolId: string, id: string): Promise<Supplier> => {
  const supplier = await prisma.supplier.findFirst({ where: { id, schoolId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return supplier;
};

const assertItem = async (schoolId: string, id: string): Promise<InventoryItem> => {
  const item = await prisma.inventoryItem.findFirst({ where: { id, schoolId } });
  if (!item) throw ApiError.notFound('Item not found');
  return item;
};

const ensureSupplierValid = async (schoolId: string, supplierId?: string | null): Promise<void> => {
  if (supplierId) await assertSupplier(schoolId, supplierId);
};

export const inventoryService = {
  // ---- Suppliers ----
  createSupplier(schoolId: string, input: CreateSupplierInput): Promise<Supplier> {
    return prisma.supplier.create({ data: { schoolId, ...input } });
  },

  listSuppliers(schoolId: string) {
    return prisma.supplier.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    });
  },

  async updateSupplier(schoolId: string, id: string, input: UpdateSupplierInput): Promise<Supplier> {
    await assertSupplier(schoolId, id);
    return prisma.supplier.update({ where: { id }, data: input });
  },

  async removeSupplier(schoolId: string, id: string): Promise<void> {
    await assertSupplier(schoolId, id);
    await prisma.supplier.delete({ where: { id } });
  },

  // ---- Items ----
  async createItem(schoolId: string, input: CreateItemInput): Promise<InventoryItem> {
    await ensureSupplierValid(schoolId, input.supplierId);
    return prisma.inventoryItem.create({
      data: {
        schoolId,
        name: input.name,
        category: input.category ?? null,
        unit: input.unit ?? null,
        quantity: input.quantity,
        reorderLevel: input.reorderLevel ?? null,
        supplierId: input.supplierId ?? null,
        // Seed an opening-stock movement so history reconciles with quantity.
        transactions: input.quantity
          ? { create: { schoolId, type: 'IN', quantity: input.quantity, note: 'Opening stock' } }
          : undefined,
      },
    });
  },

  async listItems(
    schoolId: string,
    query: ListItemsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.InventoryItemWhereInput = {
      schoolId,
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      // Column-to-column comparison: quantity at or below the reorder level.
      ...(query.lowStock
        ? {
            reorderLevel: { not: null },
            quantity: { lte: prisma.inventoryItem.fields.reorderLevel },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { supplier: { select: { id: true, name: true } } },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getItem(schoolId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, schoolId },
      include: {
        supplier: { select: { id: true, name: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { supplier: { select: { id: true, name: true } } },
        },
      },
    });
    if (!item) throw ApiError.notFound('Item not found');
    return item;
  },

  async updateItem(schoolId: string, id: string, input: UpdateItemInput): Promise<InventoryItem> {
    await assertItem(schoolId, id);
    await ensureSupplierValid(schoolId, input.supplierId);
    return prisma.inventoryItem.update({ where: { id }, data: input });
  },

  async removeItem(schoolId: string, id: string): Promise<void> {
    await assertItem(schoolId, id);
    await prisma.inventoryItem.delete({ where: { id } });
  },

  // ---- Stock movements ----
  /** Records an IN/OUT movement and adjusts the item's quantity atomically. */
  async recordTransaction(schoolId: string, itemId: string, input: StockTxnInput) {
    const item = await assertItem(schoolId, itemId);
    await ensureSupplierValid(schoolId, input.supplierId);

    if (input.type === 'OUT' && input.quantity > item.quantity) {
      throw ApiError.badRequest(`Insufficient stock (available: ${item.quantity})`);
    }

    return prisma.$transaction(async (tx) => {
      if (input.type === 'OUT') {
        // Conditional decrement prevents stock going negative under concurrency.
        const claimed = await tx.inventoryItem.updateMany({
          where: { id: itemId, quantity: { gte: input.quantity } },
          data: { quantity: { decrement: input.quantity } },
        });
        if (claimed.count === 0) {
          throw ApiError.badRequest(`Insufficient stock (available: ${item.quantity})`);
        }
      } else {
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: { increment: input.quantity } },
        });
      }

      await tx.stockTransaction.create({
        data: {
          schoolId,
          itemId,
          type: input.type,
          quantity: input.quantity,
          unitCost: input.unitCost ?? null,
          note: input.note ?? null,
          supplierId: input.supplierId ?? null,
        },
      });

      return tx.inventoryItem.findUniqueOrThrow({
        where: { id: itemId },
        include: { supplier: { select: { id: true, name: true } } },
      });
    });
  },
};
