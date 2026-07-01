import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from './inventory.api';
import type {
  CreateItemPayload,
  CreateSupplierPayload,
  ListItemsParams,
  StockTxnPayload,
} from './inventory.types';

const keys = {
  suppliers: ['inventory', 'suppliers'] as const,
  items: ['inventory', 'items'] as const,
  item: (id: string) => ['inventory', 'item', id] as const,
};

// Suppliers
export const useSuppliers = () =>
  useQuery({ queryKey: keys.suppliers, queryFn: inventoryApi.listSuppliers });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => inventoryApi.createSupplier(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.suppliers }),
  });
};

export const useDeleteSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.removeSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.suppliers }),
  });
};

// Items
export const useItems = (params: ListItemsParams) =>
  useQuery({ queryKey: [...keys.items, params], queryFn: () => inventoryApi.listItems(params) });

export const useItem = (id: string) =>
  useQuery({ queryKey: keys.item(id), queryFn: () => inventoryApi.getItem(id), enabled: !!id });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateItemPayload) => inventoryApi.createItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.items }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.removeItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.items }),
  });
};

export const useRecordStock = (itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockTxnPayload) => inventoryApi.recordStock(itemId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.item(itemId) });
      void qc.invalidateQueries({ queryKey: keys.items });
    },
  });
};
