import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMarksRoster, useSaveMarks } from '../useExams';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

interface Entry {
  marks: string;
  absent: boolean;
}

export function MarksEntryPage() {
  const { id = '', examSubjectId = '' } = useParams();
  const roster = useMarksRoster(id, examSubjectId);
  const save = useSaveMarks(id, examSubjectId);
  const [entries, setEntries] = useState<Record<string, Entry>>({});

  useEffect(() => {
    if (roster.data) {
      const next: Record<string, Entry> = {};
      for (const e of roster.data.entries) {
        next[e.student.id] = {
          marks: e.marksObtained != null ? String(e.marksObtained) : '',
          absent: e.isAbsent,
        };
      }
      setEntries(next);
    }
  }, [roster.data]);

  const max = roster.data?.maxMarks ?? 0;

  const setMarks = (studentId: string, marks: string): void =>
    setEntries((prev) => ({ ...prev, [studentId]: { marks, absent: prev[studentId]?.absent ?? false } }));

  const setAbsent = (studentId: string, absent: boolean): void =>
    setEntries((prev) => ({ ...prev, [studentId]: { marks: prev[studentId]?.marks ?? '', absent } }));

  const handleSave = (): void => {
    if (!roster.data) return;
    save.mutate(
      roster.data.entries.map((e) => {
        const entry = entries[e.student.id];
        const absent = entry?.absent ?? false;
        return {
          studentId: e.student.id,
          isAbsent: absent,
          marksObtained: absent || !entry?.marks ? null : Number(entry.marks),
        };
      }),
    );
  };

  if (roster.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (roster.isError || !roster.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(roster.error)}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={`/exams/${id}`} className="text-sm text-brand-600">← Back to exam</Link>
        <h1 className="mt-2 text-2xl font-bold">Enter marks</h1>
        <p className="text-slate-500">
          Max marks {roster.data.maxMarks} · pass {roster.data.passMarks}
        </p>
      </div>

      {roster.data.entries.length === 0 ? (
        <p className="text-sm text-slate-500">No active students in this exam's class.</p>
      ) : (
        <>
          <Card className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Marks (/{max})</th>
                  <th className="px-6 py-3">Absent</th>
                </tr>
              </thead>
              <tbody>
                {roster.data.entries.map((e) => {
                  const entry = entries[e.student.id];
                  return (
                    <tr key={e.student.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-3">
                        <p className="font-medium">{e.student.firstName} {e.student.lastName}</p>
                        <p className="font-mono text-xs text-slate-500">{e.student.admissionNo}</p>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={entry?.marks ?? ''}
                          disabled={entry?.absent}
                          onChange={(ev) => setMarks(e.student.id, ev.target.value)}
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={entry?.absent ?? false}
                          onChange={(ev) => setAbsent(e.student.id, ev.target.checked)}
                          className="size-4 accent-brand-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {save.isSuccess && <span className="text-sm text-green-700">Marks saved.</span>}
            {save.isError && <span className="text-sm text-red-600">{getApiErrorMessage(save.error)}</span>}
            <Button onClick={handleSave} isLoading={save.isPending}>Save marks</Button>
          </div>
        </>
      )}
    </div>
  );
}
