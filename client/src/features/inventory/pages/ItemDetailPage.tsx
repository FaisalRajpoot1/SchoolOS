import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteItem, useItem, useRecordStock, useSuppliers } from '../useInventory';
import type { StockTxnType } from '../inventory.types';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

export function ItemDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const item = useItem(id);
  const suppliers = useSuppliers();
  const record = useRecordStock(id);
  const deleteItem = useDeleteItem();

  const [type, setType] = useState<StockTxnType>('IN');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');

  if (item.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (item.isError || !item.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(item.error)}</p>;

  const it = item.data;
  const low = it.reorderLevel !== null && it.quantity <= it.reorderLevel;

  const handleDelete = async (): Promise<void> => {
    await deleteItem.mutateAsync(id);
    navigate('/inventory/items', { replace: true });
  };

  const submitStock = (): void => {
    if (!quantity) return;
    record.mutate(
      {
        type,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        supplierId: supplierId || undefined,
        note: note || undefined,
      },
      {
        onSuccess: () => {
          setQuantity('');
          setUnitCost('');
          setNote('');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/inventory/items" className="text-sm text-brand-600">← Back to inventory</Link>
          <h1 className="mt-2 text-2xl font-bold">{it.name}</h1>
          <p className={`text-slate-500 ${low ? 'text-red-600' : ''}`}>
            In stock: {it.quantity}{it.unit ? ` ${it.unit}` : ''}
            {it.reorderLevel !== null ? ` · reorder at ${it.reorderLevel}` : ''}
            {low ? ' · LOW' : ''}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteItem.isPending}>Delete</Button>
      </div>

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Detail label="Category" value={it.category} />
        <Detail label="Unit" value={it.unit} />
        <Detail label="Supplier" value={it.supplier?.name ?? null} />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Record stock movement</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value as StockTxnType)}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </Select>
          </div>
          <div className="w-24">
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          {type === 'IN' && (
            <>
              <div className="w-24">
                <label className="text-sm font-medium text-slate-700">Unit cost</label>
                <input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500" />
              </div>
              <div className="w-40">
                <Select label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">—</option>
                  {suppliers.data?.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </Select>
              </div>
            </>
          )}
          <div className="flex-1 min-w-32">
            <label className="text-sm font-medium text-slate-700">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <Button disabled={!quantity} isLoading={record.isPending} onClick={submitStock}>Record</Button>
        </div>
        {record.isError && <p className="text-sm text-red-600">{getApiErrorMessage(record.error)}</p>}
      </Card>

      <Card className="p-0">
        <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold">History</div>
        {it.transactions.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Unit cost</th>
                <th className="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {it.transactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 text-slate-600">{t.createdAt.slice(0, 10)}</td>
                  <td className="px-6 py-3">
                    <span className={t.type === 'IN' ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700' : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">{t.quantity}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{t.unitCost != null ? formatAmount(t.unitCost) : '—'}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {t.supplier ? `${t.supplier.name}${t.note ? ' · ' : ''}` : ''}{t.note ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-sm text-slate-500">No movements yet.</p>
        )}
      </Card>
    </div>
  );
}
