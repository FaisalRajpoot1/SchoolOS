import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeachers } from '../useTeachers';
import { STAFF_STATUSES, type StaffStatus } from '../teachers.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

const statusBadge: Record<StaffStatus, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  ON_LEAVE: 'bg-amber-50 text-amber-700',
  TERMINATED: 'bg-red-50 text-red-700',
};

export function TeachersListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StaffStatus | ''>('');
  const [page, setPage] = useState(1);

  const query = useTeachers({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });
  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-slate-500">Staff records and their login accounts.</p>
        </div>
        <Link to="/teachers/new">
          <Button>+ Add teacher</Button>
        </Link>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, or employee no…"
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StaffStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {STAFF_STATUSES.map((s) => (
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
          <p className="p-6 text-sm text-slate-500">No teachers found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Employee #</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Assignments</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs text-slate-600">{t.employeeNo}</td>
                  <td className="px-6 py-3 font-medium">
                    <Link to={`/teachers/${t.id}`} className="text-brand-700">
                      {t.firstName} {t.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{t.email}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {t._count.classSections} class · {t._count.subjectAssignments} subject
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[t.status]}`}>
                      {t.status}
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
