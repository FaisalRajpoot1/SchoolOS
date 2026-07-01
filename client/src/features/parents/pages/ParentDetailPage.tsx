import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteParent, useLinkChild, useParent, useUnlinkChild } from '../useParents';
import { useStudents } from '@/features/students/useStudents';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

export function ParentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const parent = useParent(id);
  const students = useStudents({ limit: 100 });
  const linkChild = useLinkChild(id);
  const unlinkChild = useUnlinkChild(id);
  const deleteParent = useDeleteParent();
  const [studentId, setStudentId] = useState('');

  if (parent.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (parent.isError || !parent.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(parent.error)}</p>;

  const p = parent.data;
  const linkedIds = new Set(p.children.map((c) => c.student.id));

  const handleDelete = async (): Promise<void> => {
    await deleteParent.mutateAsync(id);
    navigate('/parents', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/parents" className="text-sm text-brand-600">← Back to parents</Link>
          <h1 className="mt-2 text-2xl font-bold">{p.firstName} {p.lastName}</h1>
          <p className="text-slate-500">
            {p.email}
            {p.phone ? ` · ${p.phone}` : ''}
            {p.user && !p.user.isActive ? ' · login disabled' : ''}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteParent.isPending}>Delete</Button>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold">Children</h2>
        {p.children.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {p.children.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium">{c.student.firstName} {c.student.lastName}</span>
                  <span className="ml-2 font-mono text-xs text-slate-400">{c.student.admissionNo}</span>
                  <span className="ml-2 text-slate-500">
                    {c.student.class ? c.student.class.name : '—'}
                    {c.student.section ? ` / ${c.student.section.name}` : ''}
                    {c.relation ? ` · ${c.relation}` : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  isLoading={unlinkChild.isPending && unlinkChild.variables === c.student.id}
                  onClick={() => unlinkChild.mutate(c.student.id)}
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No children linked.</p>
        )}

        <div className="flex items-end gap-3 border-t border-slate-100 pt-4">
          <div className="flex-1">
            <Select label="Link a child" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.data?.items
                .filter((s) => !linkedIds.has(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNo})
                  </option>
                ))}
            </Select>
          </div>
          <Button
            disabled={!studentId}
            isLoading={linkChild.isPending}
            onClick={() => {
              linkChild.mutate({ studentId });
              setStudentId('');
            }}
          >
            Link
          </Button>
        </div>
        {linkChild.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(linkChild.error)}</p>
        )}
      </Card>
    </div>
  );
}
