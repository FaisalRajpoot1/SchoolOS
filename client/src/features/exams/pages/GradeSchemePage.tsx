import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradingApi, type GradeBand } from '../grading.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const KEY = ['exams', 'grade-scheme'] as const;

interface Row {
  label: string;
  min: string;
}

const toRows = (bands: GradeBand[]): Row[] =>
  bands.map((b) => ({ label: b.label, min: String(b.minPercentage) }));

export function GradeSchemePage() {
  const qc = useQueryClient();
  const scheme = useQuery({ queryKey: KEY, queryFn: () => gradingApi.getScheme() });
  const [rows, setRows] = useState<Row[]>([]);
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    if (scheme.data) {
      setRows(toRows(scheme.data.bands));
      setIsDefault(scheme.data.isDefault);
    }
  }, [scheme.data]);

  const save = useMutation({
    mutationFn: () =>
      gradingApi.setScheme(
        rows.map((r) => ({ label: r.label.trim(), minPercentage: Number(r.min) })),
      ),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      toast.success('Grade scheme saved');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const reset = useMutation({
    mutationFn: () => gradingApi.resetScheme(),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      toast.success('Reset to the default scheme');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const setRow = (i: number, patch: Partial<Row>): void =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = (): void => setRows((rs) => [...rs, { label: '', min: '' }]);
  const removeRow = (i: number): void => setRows((rs) => rs.filter((_, idx) => idx !== i));

  // Mirror the server rules client-side so a blank/invalid field can't be saved
  // (notably: Number('') is 0, which would silently create a 0-floor band).
  const problem = ((): string | null => {
    if (rows.some((r) => r.label.trim() === '')) return 'Every band needs a label.';
    if (rows.some((r) => r.min.trim() === '' || Number.isNaN(Number(r.min))))
      return 'Every band needs a numeric minimum %.';
    const labels = rows.map((r) => r.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) return 'Grade labels must be unique.';
    const mins = rows.map((r) => Number(r.min));
    if (new Set(mins).size !== mins.length) return 'Each band needs a distinct minimum %.';
    if (!mins.includes(0)) return 'The lowest band must start at 0%.';
    return null;
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grade scheme</h1>
        <p className="text-slate-500">
          Letter grades applied to exam results and report cards.
          {isDefault && ' Currently using the built-in default scale.'}
        </p>
      </div>

      <Card className="space-y-4">
        {scheme.isLoading ? (
          <Spinner />
        ) : scheme.isError ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(scheme.error)}</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex gap-3 text-xs uppercase text-slate-500">
                <span className="flex-1">Grade label</span>
                <span className="w-32">Min %</span>
                <span className="w-16" />
              </div>
              {rows.map((r, i) => (
                <div key={i} className="flex items-end gap-3">
                  <div className="flex-1">
                    <TextField
                      value={r.label}
                      placeholder="e.g. A+"
                      onChange={(e) => setRow(i, { label: e.target.value })}
                    />
                  </div>
                  <div className="w-32">
                    <TextField
                      type="number"
                      min={0}
                      max={100}
                      value={r.min}
                      onChange={(e) => setRow(i, { min: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                    className="mb-2 text-xs text-red-600 disabled:opacity-40"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addRow} className="text-sm font-medium text-brand-600">
              + Add band
            </button>

            <p className="text-xs text-slate-400">
              The lowest band must start at 0% so every score maps to a grade. Higher percentages
              take the band with the highest minimum they reach.
            </p>

            {problem && <p className="text-sm text-red-600">{problem}</p>}

            <div className="flex gap-2">
              <Button onClick={() => save.mutate()} isLoading={save.isPending} disabled={!!problem}>
                Save scheme
              </Button>
              {!isDefault && (
                <Button variant="secondary" onClick={() => reset.mutate()} isLoading={reset.isPending}>
                  Reset to default
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
