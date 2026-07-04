import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollApi, type TaxSlab } from '../payroll.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const KEY = ['payroll', 'tax-slabs'] as const;

interface Row {
  min: string;
  rate: string;
}

const toRows = (slabs: TaxSlab[]): Row[] =>
  slabs.map((s) => ({ min: String(s.minMonthly), rate: String(s.rate) }));

export function TaxSlabsPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: () => payrollApi.getTaxSlabs() });
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (query.data) setRows(toRows(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      payrollApi.setTaxSlabs(
        rows.map((r) => ({ minMonthly: Number(r.min), rate: Number(r.rate) })),
      ),
    onSuccess: (slabs) => {
      qc.setQueryData(KEY, slabs);
      toast.success('Tax slabs saved');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const setRow = (i: number, patch: Partial<Row>): void =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = (): void => setRows((rs) => [...rs, { min: '', rate: '' }]);
  const removeRow = (i: number): void => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const problem = ((): string | null => {
    for (const r of rows) {
      if (r.min.trim() === '' || Number.isNaN(Number(r.min)) || Number(r.min) < 0)
        return 'Every slab needs a non-negative minimum monthly income.';
      const rate = Number(r.rate);
      if (r.rate.trim() === '' || Number.isNaN(rate) || rate < 0 || rate > 100)
        return 'Every slab needs a rate between 0 and 100.';
    }
    const mins = rows.map((r) => Number(r.min));
    if (new Set(mins).size !== mins.length) return 'Each slab needs a distinct minimum.';
    return null;
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/payroll/payslips" className="text-sm text-brand-600">← Back to payroll</Link>
        <h1 className="mt-2 text-2xl font-bold">Tax slabs</h1>
        <p className="text-slate-500">
          Progressive monthly tax applied when generating payslips. Each rate applies only to income
          above its floor, up to the next slab. Leave empty for no tax.
        </p>
      </div>

      <Card className="space-y-4">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex gap-3 text-xs uppercase text-slate-500">
                <span className="flex-1">Min monthly income</span>
                <span className="w-28">Rate (%)</span>
                <span className="w-16" />
              </div>
              {rows.length === 0 && <p className="text-sm text-slate-400">No slabs — payroll tax is 0.</p>}
              {rows.map((r, i) => (
                <div key={i} className="flex items-end gap-3">
                  <div className="flex-1">
                    <TextField type="number" min={0} value={r.min} onChange={(e) => setRow(i, { min: e.target.value })} />
                  </div>
                  <div className="w-28">
                    <TextField type="number" min={0} max={100} value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} />
                  </div>
                  <button onClick={() => removeRow(i)} className="mb-2 text-xs text-red-600">remove</button>
                </div>
              ))}
            </div>

            <button onClick={addRow} className="text-sm font-medium text-brand-600">+ Add slab</button>

            {problem && <p className="text-sm text-red-600">{problem}</p>}

            <Button onClick={() => save.mutate()} isLoading={save.isPending} disabled={!!problem}>
              Save slabs
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
