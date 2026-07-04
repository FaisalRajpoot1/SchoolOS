import { useEffect, useState } from 'react';
import { useClearInstallments, useInstallments, useSetInstallments } from '../useFees';
import type { InstallmentStatus } from '../fees.types';
import { formatAmount } from '../format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const statusBadge: Record<InstallmentStatus, string> = {
  PAID: 'bg-green-50 text-green-700',
  PARTIAL: 'bg-blue-50 text-blue-700',
  OVERDUE: 'bg-red-50 text-red-700',
  UPCOMING: 'bg-slate-100 text-slate-500',
};

interface Row {
  label: string;
  dueDate: string;
  amount: string;
}

const blankRow = (): Row => ({ label: '', dueDate: '', amount: '' });

/** Adds `months` to a `YYYY-MM-DD` string, returning the same format. */
const addMonths = (iso: string, months: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

export function InstallmentsCard({ invoiceId, isCancelled }: { invoiceId: string; isCancelled: boolean }) {
  const plan = useInstallments(invoiceId);
  const setPlan = useSetInstallments(invoiceId);
  const clearPlan = useClearInstallments(invoiceId);

  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState('3');
  const [startDate, setStartDate] = useState('');

  // Seed the editor from the saved plan whenever it (re)loads.
  const savedRows = plan.data?.installments;
  useEffect(() => {
    if (savedRows) {
      setRows(
        savedRows.map((i) => ({
          label: i.label ?? '',
          dueDate: i.dueDate.slice(0, 10),
          amount: String(i.amount),
        })),
      );
    }
  }, [savedRows]);

  if (plan.isLoading) return <Card><p className="text-sm text-slate-500">Loading plan…</p></Card>;
  if (plan.isError || !plan.data)
    return <Card><p className="text-sm text-red-600">{getApiErrorMessage(plan.error)}</p></Card>;

  const { summary, installments } = plan.data;
  const total = summary.total;
  const editedSum = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const allDated = rows.length > 0 && rows.every((r) => r.dueDate && Number(r.amount) > 0);
  const canSave = allDated && editedSum === total;

  const updateRow = (idx: number, patch: Partial<Row>): void =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const generateEqual = (): void => {
    const n = Math.min(60, Math.max(1, Number(count) || 0));
    const start = startDate || new Date().toISOString().slice(0, 10);
    const base = Math.floor(total / n);
    setRows(
      Array.from({ length: n }, (_, i) => ({
        label: `Installment ${i + 1}`,
        dueDate: addMonths(start, i),
        // Put the rounding remainder on the final installment so the plan sums exactly.
        amount: String(i === n - 1 ? total - base * (n - 1) : base),
      })),
    );
  };

  const save = async (): Promise<void> => {
    try {
      await setPlan.mutateAsync({
        installments: rows.map((r) => ({
          label: r.label.trim() || undefined,
          dueDate: r.dueDate,
          amount: Number(r.amount),
        })),
      });
      toast.success('Installment plan saved');
      setEditing(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save the plan'));
    }
  };

  const clear = async (): Promise<void> => {
    try {
      await clearPlan.mutateAsync();
      setRows([]);
      setEditing(false);
      toast.success('Installment plan removed');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove the plan'));
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Installment plan</h2>
        {!isCancelled && !editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {installments.length > 0 ? 'Edit plan' : 'Set up plan'}
          </Button>
        )}
      </div>

      {!summary.matchesTotal && installments.length > 0 && !editing && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          This plan ({formatAmount(summary.scheduled)}) no longer matches the invoice net total
          ({formatAmount(total)}). Edit the plan to re-align it.
        </p>
      )}

      {total === 0 ? (
        <p className="text-sm text-slate-500">Nothing to schedule — this invoice has no net balance.</p>
      ) : !editing ? (
        installments.length === 0 ? (
          <p className="text-sm text-slate-500">No installment plan. Payments apply to the invoice as a whole.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">#</th>
                <th className="py-2">Installment</th>
                <th className="py-2">Due</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2 text-right">Paid</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((i) => (
                <tr key={i.seq} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 tabular-nums text-slate-400">{i.seq}</td>
                  <td className="py-2">{i.label ?? `Installment ${i.seq}`}</td>
                  <td className="py-2 tabular-nums">{i.dueDate.slice(0, 10)}</td>
                  <td className="py-2 text-right tabular-nums">{formatAmount(i.amount)}</td>
                  <td className="py-2 text-right tabular-nums text-green-700">{formatAmount(i.allocated)}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[i.status]}`}>
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3">
            <div className="w-28">
              <TextField
                label="Installments"
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <div className="w-44">
              <TextField
                label="First due date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <Button variant="secondary" type="button" onClick={generateEqual}>
              Generate equal (monthly)
            </Button>
          </div>

          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-2">
                <div className="w-40">
                  <TextField
                    label={idx === 0 ? 'Label' : undefined}
                    placeholder="Optional"
                    value={r.label}
                    onChange={(e) => updateRow(idx, { label: e.target.value })}
                  />
                </div>
                <div className="w-44">
                  <TextField
                    label={idx === 0 ? 'Due date' : undefined}
                    type="date"
                    value={r.dueDate}
                    onChange={(e) => updateRow(idx, { dueDate: e.target.value })}
                  />
                </div>
                <div className="w-32">
                  <TextField
                    label={idx === 0 ? 'Amount' : undefined}
                    type="number"
                    value={r.amount}
                    onChange={(e) => updateRow(idx, { amount: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((_, i) => i !== idx))}
                  className="pb-2 text-sm text-red-600"
                >
                  remove
                </button>
              </div>
            ))}
            <Button variant="ghost" type="button" onClick={() => setRows((rs) => [...rs, blankRow()])}>
              + Add installment
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <span className={editedSum === total ? 'text-slate-500' : 'text-red-600'}>
              Scheduled {formatAmount(editedSum)} / {formatAmount(total)}
              {editedSum !== total && ' — must match the net total'}
            </span>
            <div className="flex gap-2">
              {installments.length > 0 && (
                <Button variant="ghost" type="button" onClick={clear} isLoading={clearPlan.isPending}>
                  Clear plan
                </Button>
              )}
              <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={!canSave} isLoading={setPlan.isPending} onClick={save}>
                Save plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
