import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIssues, useReturnBook } from '../useLibrary';
import type { LibraryIssueStatus } from '../library.types';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

export function IssuesListPage() {
  const [status, setStatus] = useState<LibraryIssueStatus | ''>('ISSUED');
  const [page, setPage] = useState(1);
  const query = useIssues({ page, limit: 15, status: status || undefined });
  const returnBook = useReturnBook();
  const meta = query.data?.meta;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Issued books</h1>
          <p className="text-slate-500">Loans, returns, and late fines.</p>
        </div>
        <Link to="/library"><Button variant="secondary">Catalog</Button></Link>
      </div>

      <Card>
        <div className="w-44">
          <Select value={status} onChange={(e) => { setStatus(e.target.value as LibraryIssueStatus | ''); setPage(1); }}>
            <option value="">All</option>
            <option value="ISSUED">Issued</option>
            <option value="RETURNED">Returned</option>
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No records found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Book</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Fine</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((issue) => {
                const overdue = issue.status === 'ISSUED' && issue.dueDate.slice(0, 10) < today;
                return (
                  <tr key={issue.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3 font-medium">{issue.book.title}</td>
                    <td className="px-6 py-3 text-slate-600">{issue.student.firstName} {issue.student.lastName}</td>
                    <td className={`px-6 py-3 ${overdue ? 'font-medium text-red-600' : 'text-slate-600'}`}>
                      {issue.dueDate.slice(0, 10)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={issue.status === 'ISSUED' ? 'rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700' : 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">{issue.fineAmount ? formatAmount(issue.fineAmount) : '—'}</td>
                    <td className="px-6 py-3 text-right">
                      {issue.status === 'ISSUED' && (
                        <Button variant="secondary" isLoading={returnBook.isPending && returnBook.variables === issue.id} onClick={() => returnBook.mutate(issue.id)}>
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
