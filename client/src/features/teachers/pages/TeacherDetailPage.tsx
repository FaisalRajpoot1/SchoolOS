import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteTeacher,
  useSetTeacherStatus,
  useTeacher,
} from '../useTeachers';
import { STAFF_STATUSES, type StaffStatus } from '../teachers.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

export function TeacherDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const teacher = useTeacher(id);
  const setStatus = useSetTeacherStatus(id);
  const deleteTeacher = useDeleteTeacher();

  if (teacher.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (teacher.isError || !teacher.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(teacher.error)}</p>;

  const t = teacher.data;

  const handleDelete = async (): Promise<void> => {
    await deleteTeacher.mutateAsync(t.id);
    navigate('/teachers', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/teachers" className="text-sm text-brand-600">
            ← Back to teachers
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {t.firstName} {t.lastName}
          </h1>
          <p className="font-mono text-xs text-slate-500">{t.employeeNo}</p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteTeacher.isPending}>
          Delete
        </Button>
      </div>

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Detail label="Email" value={t.email} />
        <Detail label="Phone" value={t.phone} />
        <Detail label="Gender" value={t.gender} />
        <Detail label="Qualification" value={t.qualification} />
        <Detail label="Experience" value={t.experienceYears !== null ? `${t.experienceYears} yrs` : null} />
        <Detail label="Salary" value={t.salary !== null ? String(t.salary) : null} />
        <Detail label="Joined" value={t.joiningDate.slice(0, 10)} />
        <Detail label="Login" value={t.user ? (t.user.isActive ? 'Active' : 'Disabled') : 'No account'} />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Status</h2>
        <div className="w-48">
          <Select
            value={t.status}
            onChange={(e) => setStatus.mutate(e.target.value as StaffStatus)}
            disabled={setStatus.isPending}
          >
            {STAFF_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-slate-500">
          Setting status to anything other than ACTIVE disables the login account.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Assignments</h2>
        <div>
          <p className="text-xs uppercase text-slate-400">Class teacher of</p>
          {t.classSections.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-2">
              {t.classSections.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-100 px-2 py-1 text-sm">
                  {s.class.name} / {s.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">None</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Subject teacher of</p>
          {t.subjectAssignments.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-2">
              {t.subjectAssignments.map((a) => (
                <li key={a.id} className="rounded-lg bg-slate-100 px-2 py-1 text-sm">
                  {a.subject.name} · {a.class.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">None</p>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Assign teachers from a{' '}
          <Link to="/academics/classes" className="text-brand-600">
            class's page
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
