import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { studentsApi, type BulkImportResult, type ImportRow } from '../students.api';
import { parseCsv } from '@/lib/csvParse';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const FIELDS = [
  'firstName',
  'lastName',
  'admissionNo',
  'gender',
  'email',
  'phone',
  'className',
  'sectionName',
] as const;

const TEMPLATE = 'firstName,lastName,gender,className,sectionName\nAyesha,Khan,FEMALE,Grade 1,A';

/** Maps parsed CSV cells to import rows using the header names. */
function toRows(text: string): { rows: ImportRow[]; error: string | null } {
  const cells = parseCsv(text);
  if (cells.length < 2) return { rows: [], error: 'Add a header row plus at least one data row.' };
  const header = (cells[0] ?? []).map((h) => h.trim().toLowerCase());
  const idx: Partial<Record<(typeof FIELDS)[number], number>> = {};
  for (const f of FIELDS) {
    const i = header.indexOf(f.toLowerCase());
    if (i !== -1) idx[f] = i;
  }
  if (idx.firstName === undefined || idx.lastName === undefined) {
    return { rows: [], error: 'Header must include at least firstName and lastName.' };
  }

  const rows = cells.slice(1).map((cols) => {
    const row: Record<string, string> = {};
    for (const f of FIELDS) {
      const i = idx[f];
      if (i === undefined) continue;
      const v = (cols[i] ?? '').trim();
      if (v) row[f] = f === 'gender' ? v.toUpperCase() : v;
    }
    return row as unknown as ImportRow;
  });
  return { rows, error: null };
}

export function BulkImportPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const reparse = (value: string): void => {
    setText(value);
    setResult(null);
    const { rows: parsed, error } = value.trim() ? toRows(value) : { rows: [], error: null };
    setRows(parsed);
    setParseError(error);
  };

  const onFile = (file: File | undefined): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => reparse(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const run = async (dryRun: boolean): Promise<void> => {
    if (rows.length === 0) return;
    setBusy(true);
    try {
      const res = await studentsApi.bulkImport(rows, dryRun);
      setResult(res);
      if (!dryRun) {
        toast.success(`Imported ${res.succeeded} student(s)`);
        await queryClient.invalidateQueries({ queryKey: ['students'] });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/students" className="text-sm text-brand-600">← Back to students</Link>
        <h1 className="mt-2 text-2xl font-bold">Bulk import students</h1>
        <p className="text-slate-500">
          Paste CSV or upload a <code className="font-mono">.csv</code> file. Columns:{' '}
          <code className="font-mono text-xs">{FIELDS.join(', ')}</code> (firstName + lastName required;
          class/section matched by name).
        </p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">CSV data</label>
          <div className="flex items-center gap-3 text-sm">
            <button className="text-brand-600" onClick={() => reparse(TEMPLATE)}>
              Load example
            </button>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="text-xs"
            />
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => reparse(e.target.value)}
          rows={8}
          placeholder="firstName,lastName,className,sectionName&#10;Ayesha,Khan,Grade 1,A"
          className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm outline-none focus:border-brand-500"
        />
        {parseError && <p className="text-sm text-red-600">{parseError}</p>}
        {rows.length > 0 && <p className="text-sm text-slate-500">{rows.length} row(s) parsed.</p>}
        <div className="flex gap-2">
          <Button variant="secondary" disabled={rows.length === 0} isLoading={busy} onClick={() => run(true)}>
            Validate
          </Button>
          <Button disabled={rows.length === 0} isLoading={busy} onClick={() => run(false)}>
            Import
          </Button>
        </div>
      </Card>

      {rows.length > 0 && !result && (
        <Card className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Gender</th>
                <th className="px-4 py-2">Class / Section</th>
                <th className="px-4 py-2">Admission No</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{r.firstName} {r.lastName}</td>
                  <td className="px-4 py-2 text-slate-500">{r.gender ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {r.className ?? '—'}{r.sectionName ? ` / ${r.sectionName}` : ''}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">{r.admissionNo ?? 'auto'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 10 && (
            <p className="px-4 py-2 text-xs text-slate-400">…and {rows.length - 10} more</p>
          )}
        </Card>
      )}

      {result && (
        <Card className="space-y-2">
          <p className="text-sm">
            {result.dryRun ? 'Validation' : 'Import'} complete —{' '}
            <span className="font-medium text-green-700">{result.succeeded} ok</span>,{' '}
            <span className="font-medium text-red-600">{result.failed} failed</span> of {result.total}.
            {result.dryRun && result.failed === 0 && ' Ready to import.'}
          </p>
          {result.results.filter((r) => !r.ok).length > 0 && (
            <ul className="text-sm text-red-600">
              {result.results
                .filter((r) => !r.ok)
                .slice(0, 20)
                .map((r) => (
                  <li key={r.index}>Row {r.index + 2}: {r.error}</li>
                ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
