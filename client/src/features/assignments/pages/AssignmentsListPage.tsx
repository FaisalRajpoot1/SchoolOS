import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAssignmentsList } from '../useAssignments';
import { useClasses } from '@/features/academics/useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

export function AssignmentsListPage() {
  const [classId, setClassId] = useState('');
  const [page, setPage] = useState(1);
  const classes = useClasses();
  const query = useAssignmentsList({ page, limit: 10, classId: classId || undefined });
  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-slate-500">Graded assignments with rubrics.</p>
        </div>
        <Link to="/assignments/new">
          <Button>+ New assignment</Button>
        </Link>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select value={classId} onChange={(e) => { setClassId(e.target.value); setPage(1); }}>
            <option value="">All classes</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
          <p className="p-6 text-sm text-slate-500">No assignments found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Class / Section</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3 text-right">Max</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3 text-right">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">
                    <Link to={`/assignments/${a.id}`} className="text-brand-700">{a.title}</Link>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{a.class.name} / {a.section.name}</td>
                  <td className="px-6 py-3 text-slate-600">{a.subject?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{a.maxMarks}</td>
                  <td className="px-6 py-3 text-slate-600">{a.dueDate.slice(0, 10)}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{a._count.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
