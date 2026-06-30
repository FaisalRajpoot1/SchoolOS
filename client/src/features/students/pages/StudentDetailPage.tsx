import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useAddGuardian,
  useDeleteStudent,
  useRemoveGuardian,
  useSetStudentStatus,
  useStudent,
  useUpdateStudent,
} from '../useStudents';
import { STUDENT_STATUSES, type GuardianPayload, type StudentStatus } from '../students.types';
import { useClass, useClasses } from '@/features/academics/useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

export function StudentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const student = useStudent(id);
  const classes = useClasses();

  const setStatus = useSetStudentStatus(id);
  const updateStudent = useUpdateStudent(id);
  const deleteStudent = useDeleteStudent();
  const addGuardian = useAddGuardian(id);
  const removeGuardian = useRemoveGuardian(id);

  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  useEffect(() => {
    if (student.data) {
      setClassId(student.data.class?.id ?? '');
      setSectionId(student.data.section?.id ?? '');
    }
  }, [student.data]);

  const classDetail = useClass(classId);
  const sections = classId ? (classDetail.data?.sections ?? []) : [];

  const guardianForm = useForm<GuardianPayload>();

  if (student.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (student.isError || !student.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(student.error)}</p>;

  const s = student.data;

  const saveEnrollment = (): void => {
    updateStudent.mutate({
      classId: classId || null,
      sectionId: classId && sectionId ? sectionId : null,
    });
  };

  const onAddGuardian = guardianForm.handleSubmit(async (values) => {
    await addGuardian.mutateAsync({ ...values, isPrimary: values.isPrimary ?? false });
    guardianForm.reset({ relation: '', firstName: '', lastName: '', phone: '', email: '' });
  });

  const handleDelete = async (): Promise<void> => {
    await deleteStudent.mutateAsync(s.id);
    navigate('/students', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/students" className="text-sm text-brand-600">
            ← Back to students
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {s.firstName} {s.lastName}
          </h1>
          <p className="font-mono text-xs text-slate-500">{s.admissionNo}</p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteStudent.isPending}>
          Delete
        </Button>
      </div>

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Detail label="Gender" value={s.gender} />
        <Detail label="Date of birth" value={s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : null} />
        <Detail label="Admitted" value={s.admissionDate.slice(0, 10)} />
        <Detail label="Email" value={s.email} />
        <Detail label="Phone" value={s.phone} />
        <Detail label="Address" value={s.address} />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Status & enrollment</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            value={s.status}
            onChange={(e) => setStatus.mutate(e.target.value as StudentStatus)}
            disabled={setStatus.isPending}
          >
            {STUDENT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
          <Select
            label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId('');
            }}
          >
            <option value="">—</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
          >
            <option value="">—</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveEnrollment} isLoading={updateStudent.isPending}>
            Save enrollment
          </Button>
          {updateStudent.isSuccess && <span className="text-sm text-green-700">Saved.</span>}
          {updateStudent.isError && (
            <span className="text-sm text-red-600">{getApiErrorMessage(updateStudent.error)}</span>
          )}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Guardians</h2>
        {s.guardians.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {s.guardians.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {g.firstName} {g.lastName}
                    {g.isPrimary && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Primary
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {g.relation}
                    {g.phone ? ` · ${g.phone}` : ''}
                    {g.email ? ` · ${g.email}` : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  isLoading={removeGuardian.isPending && removeGuardian.variables === g.id}
                  onClick={() => removeGuardian.mutate(g.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No guardians recorded.</p>
        )}

        <form onSubmit={onAddGuardian} className="space-y-4 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">Add guardian</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Relation" placeholder="Father" {...guardianForm.register('relation', { required: true })} />
            <TextField label="First name" {...guardianForm.register('firstName', { required: true })} />
            <TextField label="Last name" {...guardianForm.register('lastName', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Phone" {...guardianForm.register('phone')} />
            <TextField label="Email" type="email" {...guardianForm.register('email')} />
          </div>
          {addGuardian.isError && (
            <p className="text-sm text-red-600">{getApiErrorMessage(addGuardian.error)}</p>
          )}
          <Button type="submit" isLoading={addGuardian.isPending}>
            Add guardian
          </Button>
        </form>
      </Card>
    </div>
  );
}
