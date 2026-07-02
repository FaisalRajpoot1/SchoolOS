import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreatePayslip, useGeneratePayslips, usePayslips } from '../usePayroll';
import { MONTHS, type PayslipStatus } from '../payroll.types';
import { useEmployees } from '@/features/hr/useHr';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';

const thisYear = new Date().getFullYear();

export function PayslipsListPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(thisYear);
  const [status, setStatus] = useState<PayslipStatus | ''>('');

  const employees = useEmployees({ limit: 100, status: 'ACTIVE' });
  const query = usePayslips({
    periodMonth: month,
    periodYear: year,
    status: status || undefined,
    limit: 100,
  });
  const generate = useGeneratePayslips();
  const create = useCreatePayslip();

  const [employeeId, setEmployeeId] = useState('');
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');
  const [tax, setTax] = useState('');

  const createPayslip = (): void => {
    if (!employeeId) return;
    create.mutate(
      {
        employeeId,
        periodMonth: month,
        periodYear: year,
        bonus: bonus ? Number(bonus) : undefined,
        deductions: deductions ? Number(deductions) : undefined,
        tax: tax ? Number(tax) : undefined,
      },
      { onSuccess: () => { setEmployeeId(''); setBonus(''); setDeductions(''); setTax(''); } },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-slate-500">Monthly payslips for staff.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
          </Select>
        </div>
        <div className="w-24">
          <label className="text-sm font-medium text-slate-700">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="w-36">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as PayslipStatus | '')}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PAID">Paid</option>
          </Select>
        </div>
        <Button variant="secondary" isLoading={generate.isPending} onClick={() => generate.mutate({ month, year })}>
          Generate for {MONTHS[month - 1]} {year}
        </Button>
        {generate.isSuccess && <span className="pb-2 text-sm text-green-700">{generate.data.created} created</span>}
        {generate.isError && <span className="pb-2 text-sm text-red-600">{getApiErrorMessage(generate.error)}</span>}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">New payslip for {MONTHS[month - 1]} {year}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Select label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select employee</option>
              {employees.data?.items.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
              ))}
            </Select>
          </div>
          <div className="w-24"><label className="text-sm font-medium text-slate-700">Bonus</label><input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500" /></div>
          <div className="w-24"><label className="text-sm font-medium text-slate-700">Deduct</label><input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500" /></div>
          <div className="w-24"><label className="text-sm font-medium text-slate-700">Tax</label><input type="number" value={tax} onChange={(e) => setTax(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500" /></div>
          <Button disabled={!employeeId} isLoading={create.isPending} onClick={createPayslip}>Create</Button>
        </div>
        {create.isError && <p className="text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState
            title="No payslips for this period"
            description="Generate payslips or create one above."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3 text-right">Basic</th>
                <th className="px-6 py-3 text-right">Net pay</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">
                    <Link to={`/payroll/payslips/${p.id}`} className="text-brand-700">{p.employee.firstName} {p.employee.lastName}</Link>
                    <span className="ml-2 font-mono text-xs text-slate-400">{p.employee.employeeCode}</span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">{formatAmount(p.basicSalary)}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">{formatAmount(p.netPay)}</td>
                  <td className="px-6 py-3">
                    <span className={p.status === 'PAID' ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700' : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
