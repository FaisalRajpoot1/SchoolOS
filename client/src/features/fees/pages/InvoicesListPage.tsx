import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplyLateFees, useInvoices } from '../useFees';
import { INVOICE_STATUSES, type InvoiceStatus } from '../fees.types';
import { formatAmount } from '../format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const statusBadge: Record<InvoiceStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PARTIAL: 'bg-blue-50 text-blue-700',
  PAID: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export function InvoicesListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);

  const query = useInvoices({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });
  const meta = query.data?.meta;

  const [showLateFee, setShowLateFee] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('');
  const [graceDays, setGraceDays] = useState('0');
  const applyLateFees = useApplyLateFees();

  const onApplyLateFees = (): void => {
    const amount = Number(lateFeeAmount);
    if (!Number.isInteger(amount) || amount < 1) {
      toast.error('Enter a late-fee amount of at least 1');
      return;
    }
    applyLateFees.mutate(
      { amount, graceDays: Math.max(0, Number(graceDays) || 0) },
      {
        onSuccess: (res) => {
          toast.success(
            res.applied === 0
              ? 'No overdue invoices to charge'
              : `Late fee applied to ${res.applied} invoice(s)`,
          );
          setShowLateFee(false);
          setLateFeeAmount('');
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'Could not apply late fees')),
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-slate-500">Student fee invoices and payments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowLateFee((v) => !v)}>
            Apply late fees
          </Button>
          <Link to="/fees/invoices/new">
            <Button>+ New invoice</Button>
          </Link>
        </div>
      </div>

      {showLateFee && (
        <Card className="flex flex-wrap items-end gap-3 border-amber-200 bg-amber-50/40">
          <div>
            <p className="text-sm font-medium text-slate-700">Apply a flat late fee</p>
            <p className="text-xs text-slate-500">
              Charges every overdue, still-owing invoice that doesn&apos;t already have one.
            </p>
          </div>
          <div className="w-32">
            <label className="text-xs font-medium text-slate-600">Amount</label>
            <input
              type="number"
              min={1}
              value={lateFeeAmount}
              onChange={(e) => setLateFeeAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-medium text-slate-600">Grace days</label>
            <input
              type="number"
              min={0}
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <Button onClick={onApplyLateFees} isLoading={applyLateFees.isPending}>
            Apply
          </Button>
        </Card>
      )}

      <Card className="flex flex-wrap items-end gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by invoice no or title…"
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as InvoiceStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No invoices found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Balance</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link to={`/fees/invoices/${inv.id}`} className="font-medium text-brand-700">
                      {inv.invoiceNo}
                    </Link>
                    <p className="text-xs text-slate-500">{inv.title}</p>
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {inv.student.firstName} {inv.student.lastName}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">{formatAmount(inv.totals.total)}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">
                    {formatAmount(inv.totals.balance)}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
