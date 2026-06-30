import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolsList, useSetSchoolStatus } from '../useSchools';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function SchoolsListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useSchoolsList({ page, limit: 10, search: search || undefined });
  const setStatus = useSetSchoolStatus();

  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="text-slate-500">Manage every school on the platform.</p>
        </div>
        <Link to="/schools/new">
          <Button>+ New school</Button>
        </Link>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by name, slug, or email…"
        className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No schools found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((school) => (
                <tr key={school.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-medium">{school.name}</td>
                  <td className="px-6 py-3 text-slate-500">{school.slug}</td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        school.isActive
                          ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                          : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                      }
                    >
                      {school.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button
                      variant={school.isActive ? 'secondary' : 'primary'}
                      isLoading={setStatus.isPending && setStatus.variables?.id === school.id}
                      onClick={() => setStatus.mutate({ id: school.id, isActive: !school.isActive })}
                    >
                      {school.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
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
            <Button
              variant="secondary"
              disabled={!meta.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
