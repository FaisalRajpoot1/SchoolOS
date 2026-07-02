import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdmissions,
  useConvertAdmission,
  useDeleteAdmission,
  useSetAdmissionStatus,
} from '../useAdmissions';
import { ADMISSION_STATUSES, type AdmissionStatus } from '../admissions.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const badge: Record<AdmissionStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-600',
  REVIEWING: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-700',
  CONVERTED: 'bg-green-50 text-green-700',
};

const EDITABLE: AdmissionStatus[] = ['SUBMITTED', 'REVIEWING', 'ACCEPTED', 'REJECTED'];

export function AdmissionsPage() {
  const [status, setStatus] = useState<AdmissionStatus | ''>('');
  const [page, setPage] = useState(1);
  const query = useAdmissions({ page, limit: 10, status: status || undefined });
  const setStatusMutation = useSetAdmissionStatus();
  const convert = useConvertAdmission();
  const remove = useDeleteAdmission();
  const meta = query.data?.meta;

  const doConvert = (id: string): void => {
    if (!window.confirm('Convert this application into an enrolled student?')) return;
    convert.mutate(id, {
      onSuccess: () => toast.success('Application converted to a student'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const doDelete = (id: string): void => {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Application deleted'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const changeStatus = (id: string, next: string): void => {
    setStatusMutation.mutate(
      { id, status: next },
      { onError: (err) => toast.error(getApiErrorMessage(err)) },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admissions</h1>
        <p className="text-slate-500">Enquiries submitted via the public application form.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AdmissionStatus | '');
              setPage(1);
            }}
          >
            <option value="">All</option>
            {ADMISSION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState title="No applications" description="New enquiries will appear here." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Guardian</th>
                <th className="px-4 py-3">Desired</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.applicantFirstName} {a.applicantLastName}</p>
                    <p className="text-xs text-slate-400">{a.createdAt.slice(0, 10)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.guardianName}
                    <p className="text-xs text-slate-400">{a.guardianPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.desiredClass ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[a.status]}`}>
                      {a.status}
                    </span>
                    {a.student && (
                      <p className="mt-1 text-xs">
                        <Link to={`/students/${a.student.id}`} className="text-brand-600">
                          {a.student.admissionNo}
                        </Link>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'CONVERTED' ? (
                      <span className="text-xs text-slate-400">Enrolled</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          aria-label="Set status"
                          className="w-32 py-1"
                          value={a.status}
                          onChange={(e) => changeStatus(a.id, e.target.value)}
                        >
                          {EDITABLE.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </Select>
                        <Button className="py-1" onClick={() => doConvert(a.id)} isLoading={convert.isPending && convert.variables === a.id}>
                          Convert
                        </Button>
                        <Button
                          variant="danger"
                          className="py-1"
                          onClick={() => doDelete(a.id)}
                          isLoading={remove.isPending && remove.variables === a.id}
                        >
                          Delete
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
