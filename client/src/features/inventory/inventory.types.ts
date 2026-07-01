import type { PaginationMeta } from '@/features/schools/schools.types';

export type StockTxnType = 'IN' | 'OUT';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  _count?: { items: number };
}

export interface StockTransaction {
  id: string;
  type: StockTxnType;
  quantity: number;
  unitCost: number | null;
  note: string | null;
  createdAt: string;
  supplier: { id: string; name: string } | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  quantity: number;
  reorderLevel: number | null;
  supplier: { id: string; name: string } | null;
}

export interface InventoryItemDetail extends InventoryItem {
  transactions: StockTransaction[];
}

export interface CreateSupplierPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface CreateItemPayload {
  name: string;
  category?: string;
  unit?: string;
  quantity: number;
  reorderLevel?: number;
  supplierId?: string;
}

export interface StockTxnPayload {
  type: StockTxnType;
  quantity: number;
  unitCost?: number;
  note?: string;
  supplierId?: string;
}

export interface ListItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: string;
  lowStock?: boolean;
}

export type { PaginationMeta };
