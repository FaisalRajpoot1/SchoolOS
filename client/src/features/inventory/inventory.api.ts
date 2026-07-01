import { api } from '@/lib/axios';
import type {
  CreateItemPayload,
  CreateSupplierPayload,
  InventoryItem,
  InventoryItemDetail,
  ListItemsParams,
  PaginationMeta,
  StockTxnPayload,
  Supplier,
} from './inventory.types';

export const inventoryApi = {
  // Suppliers
  async listSuppliers(): Promise<Supplier[]> {
    const { data } = await api.get<{ data: Supplier[] }>('/inventory/suppliers');
    return data.data;
  },
  async createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
    const { data } = await api.post<{ data: { supplier: Supplier } }>('/inventory/suppliers', payload);
    return data.data.supplier;
  },
  async removeSupplier(id: string): Promise<void> {
    await api.delete(`/inventory/suppliers/${id}`);
  },

  // Items
  async listItems(params: ListItemsParams): Promise<{ items: InventoryItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: InventoryItem[]; meta: PaginationMeta }>('/inventory/items', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async getItem(id: string): Promise<InventoryItemDetail> {
    const { data } = await api.get<{ data: { item: InventoryItemDetail } }>(`/inventory/items/${id}`);
    return data.data.item;
  },
  async createItem(payload: CreateItemPayload): Promise<InventoryItem> {
    const { data } = await api.post<{ data: { item: InventoryItem } }>('/inventory/items', payload);
    return data.data.item;
  },
  async removeItem(id: string): Promise<void> {
    await api.delete(`/inventory/items/${id}`);
  },
  async recordStock(id: string, payload: StockTxnPayload): Promise<InventoryItem> {
    const { data } = await api.post<{ data: { item: InventoryItem } }>(
      `/inventory/items/${id}/stock`,
      payload,
    );
    return data.data.item;
  },
};
