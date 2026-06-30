import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExams } from '../useExams';
import type { ExamStatus } from '../exams.types';
import { useClasses } from '@/features/academics/useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

export function ExamsListPage() {
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<ExamStatus | ''>('');
  const [page, setPage] = useState(1);

  const classes = useClasses();
  const query = useExams({
    page,
    limit: 10,
    classId: classId || undefined,
    status: status || undefined,
  });
  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-slate-500">Examinations, marking schemes, and results.</p>
        </div>
        <Link to="/exams/new">
          <Button>+ New exam</Button>
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
        <div className="w-40">
          <Select value={status} onChange={(e) => { setStatus(e.target.value as ExamStatus | ''); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No exams found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Exam</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Subjects</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((exam) => (
                <tr key={exam.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">
                    <Link to={`/exams/${exam.id}`} className="text-brand-700">{exam.name}</Link>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{exam.class.name}</td>
                  <td className="px-6 py-3 text-slate-600">{exam._count.examSubjects}</td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        exam.status === 'PUBLISHED'
                          ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                          : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                      }
                    >
                      {exam.status}
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
