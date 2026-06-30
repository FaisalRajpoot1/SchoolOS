import { useState } from 'react';
import { useAuditLogs } from '../useAudit';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const query = useAuditLogs({ page, limit: 20, action: action || undefined });
  const meta = query.data?.meta;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit logs</h1>
        <p className="text-slate-500">Security-relevant activity across your school.</p>
      </div>

      <Card>
        <input
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by action (e.g. auth.login)…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No audit events found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">IP</th>
                <th className="px-6 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{log.ipAddress ?? '—'}</td>
                  <td className="px-6 py-3 text-slate-500">{log.createdAt.replace('T', ' ').slice(0, 16)}</td>
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
