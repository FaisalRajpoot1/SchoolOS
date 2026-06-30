import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSubject, useDeleteSubject, useSubjects } from '../useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(1, 'Code is required').regex(/^[A-Za-z0-9-]+$/, 'Letters, numbers, hyphens only'),
});

type FormValues = z.infer<typeof schema>;

export function SubjectsPage() {
  const subjects = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await createSubject.mutateAsync(values);
    reset();
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subjects</h1>
        <p className="text-slate-500">The subject catalog for your school.</p>
      </div>

      <Card className="space-y-4">
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40">
            <TextField label="Subject name" placeholder="Mathematics" {...register('name')} error={errors.name?.message} />
          </div>
          <div className="w-32">
            <TextField label="Code" placeholder="MATH" {...register('code')} error={errors.code?.message} />
          </div>
          <div className="pt-6">
            <Button type="submit" isLoading={createSubject.isPending}>
              Add
            </Button>
          </div>
        </form>
        {createSubject.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(createSubject.error)}</p>
        )}
      </Card>

      <Card className="p-0">
        {subjects.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : subjects.data && subjects.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {subjects.data.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <span className="font-medium">{subject.name}</span>
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                    {subject.code}
                  </span>
                </div>
                <Button
                  variant="danger"
                  isLoading={deleteSubject.isPending && deleteSubject.variables === subject.id}
                  onClick={() => deleteSubject.mutate(subject.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No subjects yet.</p>
        )}
      </Card>
    </div>
  );
}
