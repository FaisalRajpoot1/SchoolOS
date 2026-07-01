import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateParent } from '../useParents';
import { useStudents } from '@/features/students/useStudents';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  phone: z.string().optional(),
  occupation: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddParentPage() {
  const navigate = useNavigate();
  const students = useStudents({ limit: 100 });
  const createParent = useCreateParent();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const toggle = (id: string): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSubmit = handleSubmit(async (values) => {
    const parent = await createParent.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phone: values.phone?.trim() || undefined,
      occupation: values.occupation?.trim() || undefined,
      studentIds: [...selected],
    });
    navigate(`/parents/${parent.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/parents" className="text-sm text-brand-600">← Back to parents</Link>
        <h1 className="mt-2 text-2xl font-bold">Add parent</h1>
        <p className="text-slate-500">Creates a PARENT login linked to selected children.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold">Identity & login</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" {...register('firstName')} error={errors.firstName?.message} />
            <TextField label="Last name" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email (login)" type="email" autoComplete="off" {...register('email')} error={errors.email?.message} />
            <TextField label="Temporary password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Phone (optional)" {...register('phone')} />
            <TextField label="Occupation (optional)" {...register('occupation')} />
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Children</h2>
          {students.isLoading ? (
            <p className="text-sm text-slate-500">Loading students…</p>
          ) : students.data && students.data.items.length > 0 ? (
            <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {students.data.items.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="size-4 accent-brand-600" />
                  {s.firstName} {s.lastName}
                  <span className="ml-auto font-mono text-xs text-slate-400">{s.admissionNo}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No students yet.</p>
          )}
        </Card>

        {createParent.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createParent.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/parents')}>Cancel</Button>
          <Button type="submit" isLoading={createParent.isPending}>Add parent</Button>
        </div>
      </form>
    </div>
  );
}
