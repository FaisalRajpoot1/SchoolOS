import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCertificates, useIssueCertificate } from '../useCertificates';
import { CERTIFICATE_TYPES, type CertificateType } from '../certificates.types';
import { useStudents } from '@/features/students/useStudents';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

export function CertificatesListPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState<CertificateType>('BONAFIDE');
  const [page, setPage] = useState(1);

  const students = useStudents({ limit: 100 });
  const query = useCertificates({ page, limit: 10 });
  const issue = useIssueCertificate();
  const meta = query.data?.meta;

  const submit = (): void => {
    if (!studentId) return;
    issue.mutate(
      { studentId, type },
      {
        onSuccess: (cert) => {
          toast.success('Certificate issued');
          navigate(`/certificates/${cert.id}`);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificates</h1>
        <p className="text-slate-500">Issue and verify student certificates.</p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Issue a certificate</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.data?.items.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value as CertificateType)}>
              {CERTIFICATE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </Select>
          </div>
          <Button disabled={!studentId} isLoading={issue.isPending} onClick={submit}>Issue</Button>
        </div>
        {issue.isError && <p className="text-sm text-red-600">{getApiErrorMessage(issue.error)}</p>}
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState
            title="No certificates yet"
            description="Issue a certificate using the form above."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Serial</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Issued</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs">
                    <Link to={`/certificates/${c.id}`} className="text-brand-700">{c.serialNo}</Link>
                  </td>
                  <td className="px-6 py-3 font-medium">{c.student.firstName} {c.student.lastName}</td>
                  <td className="px-6 py-3 text-slate-600">{c.type}</td>
                  <td className="px-6 py-3 text-slate-600">{c.issueDate.slice(0, 10)}</td>
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
