import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateItem, useItems, useSuppliers } from '../useInventory';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().int().min(0),
  reorderLevel: z.string().optional(),
  supplierId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ItemsListPage() {
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const suppliers = useSuppliers();
  const query = useItems({
    page,
    limit: 10,
    search: search || undefined,
    lowStock: lowStock || undefined,
  });
  const create = useCreateItem();
  const meta = query.data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      name: values.name,
      category: values.category?.trim() || undefined,
      unit: values.unit?.trim() || undefined,
      quantity: values.quantity,
      reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : undefined,
      supplierId: values.supplierId || undefined,
    });
    reset({ quantity: 0, name: '', category: '', unit: '', reorderLevel: '', supplierId: '' });
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-slate-500">Assets, stationery, and stock levels.</p>
        </div>
        <Link to="/inventory/suppliers"><Button variant="secondary">Suppliers</Button></Link>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-36"><TextField label="Item" {...register('name')} error={errors.name?.message} /></div>
          <div className="w-32"><TextField label="Category" {...register('category')} /></div>
          <div className="w-24"><TextField label="Unit" {...register('unit')} /></div>
          <div className="w-20"><TextField label="Qty" type="number" {...register('quantity')} /></div>
          <div className="w-24"><TextField label="Reorder" type="number" {...register('reorderLevel')} /></div>
          <div className="w-40">
            <Select label="Supplier" {...register('supplierId')}>
              <option value="">—</option>
              {suppliers.data?.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </Select>
          </div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Add</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      <Card className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or category…"
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1); }} className="size-4 accent-brand-600" />
          Low stock only
        </label>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No items found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3 text-right">In stock</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((item) => {
                const low = item.reorderLevel !== null && item.quantity <= item.reorderLevel;
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">
                      <Link to={`/inventory/items/${item.id}`} className="text-brand-700">{item.name}</Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{item.category ?? '—'}</td>
                    <td className="px-6 py-3 text-slate-600">{item.supplier?.name ?? '—'}</td>
                    <td className={`px-6 py-3 text-right tabular-nums ${low ? 'font-semibold text-red-600' : ''}`}>
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ''}
                      {low && <span className="ml-1 text-xs">low</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
