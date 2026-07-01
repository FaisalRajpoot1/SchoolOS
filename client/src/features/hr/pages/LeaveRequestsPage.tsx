import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeaveList, useReviewLeave } from '../useHr';
import type { LeaveStatus } from '../hr.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

const statusBadge: Record<LeaveStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
};

export function LeaveRequestsPage() {
  const [status, setStatus] = useState<LeaveStatus | ''>('PENDING');
  const [page, setPage] = useState(1);
  const query = useLeaveList({ page, limit: 15, status: status || undefined });
  const review = useReviewLeave();
  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave requests</h1>
          <p className="text-slate-500">Review and approve staff leave.</p>
        </div>
        <Link to="/hr/employees"><Button variant="secondary">Employees</Button></Link>
      </div>

      <Card>
        <div className="w-44">
          <Select value={status} onChange={(e) => { setStatus(e.target.value as LeaveStatus | ''); setPage(1); }}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No leave requests.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-medium">
                    {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : '—'}
                    {l.employee && <span className="ml-2 font-mono text-xs text-slate-400">{l.employee.employeeCode}</span>}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{l.type}</td>
                  <td className="px-6 py-3 text-slate-600">{l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[l.status]}`}>{l.status}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {l.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" isLoading={review.isPending && review.variables?.leaveId === l.id && review.variables.status === 'APPROVED'} onClick={() => review.mutate({ leaveId: l.id, status: 'APPROVED' })}>
                          Approve
                        </Button>
                        <Button variant="ghost" isLoading={review.isPending && review.variables?.leaveId === l.id && review.variables.status === 'REJECTED'} onClick={() => review.mutate({ leaveId: l.id, status: 'REJECTED' })}>
                          Reject
                        </Button>
                      </div>
                    )}
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
