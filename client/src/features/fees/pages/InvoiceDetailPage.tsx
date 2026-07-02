import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { invoicesApi } from '../fees.api';
import {
  useAddPayment,
  useCancelInvoice,
  useDeleteInvoice,
  useInvoice,
  useRemovePayment,
} from '../useFees';
import { PAYMENT_METHODS, type InvoiceStatus } from '../fees.types';
import { formatAmount } from '../format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const statusBadge: Record<InvoiceStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PARTIAL: 'bg-blue-50 text-blue-700',
  PAID: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const paymentSchema = z.object({
  amount: z.coerce.number().int().min(1, 'Enter an amount'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER']),
  reference: z.string().optional(),
  note: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const invoice = useInvoice(id);
  const addPayment = useAddPayment(id);
  const removePayment = useRemovePayment(id);
  const cancelInvoice = useCancelInvoice(id);
  const deleteInvoice = useDeleteInvoice();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), defaultValues: { method: 'CASH' } });

  const onAddPayment = handleSubmit(async (values) => {
    await addPayment.mutateAsync({
      amount: values.amount,
      method: values.method,
      reference: values.reference?.trim() || undefined,
      note: values.note?.trim() || undefined,
    });
    reset({ method: 'CASH', amount: undefined, reference: '', note: '' });
  });

  const [downloading, setDownloading] = useState(false);

  const handleDelete = async (): Promise<void> => {
    await deleteInvoice.mutateAsync(id);
    navigate('/fees/invoices', { replace: true });
  };

  const handleDownload = async (): Promise<void> => {
    if (!invoice.data) return;
    setDownloading(true);
    try {
      await invoicesApi.downloadInvoicePdf(invoice.data.id, invoice.data.invoiceNo);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (invoice.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (invoice.isError || !invoice.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(invoice.error)}</p>;

  const inv = invoice.data;
  const isCancelled = inv.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/fees/invoices" className="text-sm text-brand-600">
            ← Back to invoices
          </Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold">
            {inv.invoiceNo}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[inv.status]}`}>
              {inv.status}
            </span>
          </h1>
          <p className="text-slate-500">
            {inv.title} · {inv.student.firstName} {inv.student.lastName} ({inv.student.admissionNo})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownload} isLoading={downloading}>
            Download PDF
          </Button>
          {!isCancelled && (
            <Button variant="secondary" onClick={() => cancelInvoice.mutate()} isLoading={cancelInvoice.isPending}>
              Cancel invoice
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete} isLoading={deleteInvoice.isPending}>
            Delete
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-right">Qty</th>
              <th className="px-6 py-3 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="px-6 py-3">
                  {item.description}
                  {item.category && <span className="ml-2 text-xs text-slate-400">{item.category.name}</span>}
                </td>
                <td className="px-6 py-3 text-right tabular-nums">{formatAmount(item.amount)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatAmount(item.amount * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="flex justify-end">
        <dl className="w-56 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Total</dt>
            <dd className="tabular-nums">{formatAmount(inv.totals.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Paid</dt>
            <dd className="tabular-nums text-green-700">{formatAmount(inv.totals.paid)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold">
            <dt>Balance</dt>
            <dd className="tabular-nums">{formatAmount(inv.totals.balance)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Payments</h2>
        {inv.payments.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {inv.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium tabular-nums">{formatAmount(p.amount)}</span>
                  <span className="ml-2 text-slate-500">{p.method}</span>
                  {p.reference && <span className="ml-2 text-xs text-slate-400">ref: {p.reference}</span>}
                  <span className="ml-2 text-xs text-slate-400">{p.paidAt.slice(0, 10)}</span>
                </div>
                <Button
                  variant="ghost"
                  isLoading={removePayment.isPending && removePayment.variables === p.id}
                  onClick={() => removePayment.mutate(p.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No payments recorded.</p>
        )}

        {!isCancelled && (
          <form onSubmit={onAddPayment} noValidate className="flex flex-wrap items-start gap-3 border-t border-slate-100 pt-4">
            <div className="w-32">
              <TextField label="Amount" type="number" {...register('amount')} error={errors.amount?.message} />
            </div>
            <div className="w-40">
              <Select label="Method" {...register('method')}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-40">
              <TextField label="Reference (optional)" {...register('reference')} />
            </div>
            <div className="pt-6">
              <Button type="submit" isLoading={addPayment.isPending}>
                Record payment
              </Button>
            </div>
          </form>
        )}
        {addPayment.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(addPayment.error)}</p>
        )}
      </Card>
    </div>
  );
}
