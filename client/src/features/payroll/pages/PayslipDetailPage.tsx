import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeletePayslip, usePayPayslip, usePayslip, useUpdatePayslip } from '../usePayroll';
import { MONTHS } from '../payroll.types';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

interface Amounts {
  basicSalary: string;
  allowances: string;
  bonus: string;
  deductions: string;
  tax: string;
}

const FIELDS: { key: keyof Amounts; label: string }[] = [
  { key: 'basicSalary', label: 'Basic salary' },
  { key: 'allowances', label: 'Allowances' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'deductions', label: 'Deductions' },
  { key: 'tax', label: 'Tax' },
];

export function PayslipDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const payslip = usePayslip(id);
  const update = useUpdatePayslip(id);
  const pay = usePayPayslip(id);
  const remove = useDeletePayslip();

  const [amounts, setAmounts] = useState<Amounts>({
    basicSalary: '', allowances: '', bonus: '', deductions: '', tax: '',
  });

  useEffect(() => {
    if (payslip.data) {
      setAmounts({
        basicSalary: String(payslip.data.basicSalary),
        allowances: String(payslip.data.allowances),
        bonus: String(payslip.data.bonus),
        deductions: String(payslip.data.deductions),
        tax: String(payslip.data.tax),
      });
    }
  }, [payslip.data]);

  if (payslip.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (payslip.isError || !payslip.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(payslip.error)}</p>;

  const p = payslip.data;
  const isDraft = p.status === 'DRAFT';
  const preview =
    (Number(amounts.basicSalary) || 0) +
    (Number(amounts.allowances) || 0) +
    (Number(amounts.bonus) || 0) -
    (Number(amounts.deductions) || 0) -
    (Number(amounts.tax) || 0);

  const handleDelete = async (): Promise<void> => {
    await remove.mutateAsync(id);
    navigate('/payroll/payslips', { replace: true });
  };

  const save = (): void => {
    update.mutate({
      basicSalary: Number(amounts.basicSalary) || 0,
      allowances: Number(amounts.allowances) || 0,
      bonus: Number(amounts.bonus) || 0,
      deductions: Number(amounts.deductions) || 0,
      tax: Number(amounts.tax) || 0,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/payroll/payslips" className="text-sm text-brand-600">← Back to payroll</Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold">
            Payslip
            <span className={p.status === 'PAID' ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700' : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'}>
              {p.status}
            </span>
          </h1>
          <p className="text-slate-500">
            {p.employee.firstName} {p.employee.lastName} · {MONTHS[p.periodMonth - 1]} {p.periodYear}
            {p.paidAt ? ` · paid ${p.paidAt.slice(0, 10)}` : ''}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={remove.isPending}>Delete</Button>
      </div>

      <Card className="space-y-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between">
            <label className="text-sm text-slate-600">{f.label}</label>
            {isDraft ? (
              <input
                type="number"
                value={amounts[f.key]}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm outline-none focus:border-brand-500"
              />
            ) : (
              <span className="tabular-nums">{formatAmount(p[f.key])}</span>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-lg font-semibold">
          <span>Net pay</span>
          <span className="tabular-nums">{formatAmount(isDraft ? preview : p.netPay)}</span>
        </div>
      </Card>

      {isDraft && (
        <div className="flex items-center justify-end gap-3">
          {update.isSuccess && <span className="text-sm text-green-700">Saved.</span>}
          {(update.isError || pay.isError) && (
            <span className="text-sm text-red-600">{getApiErrorMessage(update.error ?? pay.error)}</span>
          )}
          <Button variant="secondary" onClick={save} isLoading={update.isPending}>Save</Button>
          <Button onClick={() => pay.mutate()} isLoading={pay.isPending}>Mark paid</Button>
        </div>
      )}
    </div>
  );
}
