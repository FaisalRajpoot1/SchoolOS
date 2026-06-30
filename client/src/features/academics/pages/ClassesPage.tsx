import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useClasses, useCreateClass, useDeleteClass } from '../useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Level must be a number'),
});

type FormValues = z.infer<typeof schema>;

export function ClassesPage() {
  const classes = useClasses();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await createClass.mutateAsync({
      name: values.name,
      level: values.level ? Number(values.level) : undefined,
    });
    reset();
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="text-slate-500">Grades, their sections, and offered subjects.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40">
            <TextField label="Class name" placeholder="Grade 1" {...register('name')} error={errors.name?.message} />
          </div>
          <div className="w-28">
            <TextField label="Level" placeholder="1" inputMode="numeric" {...register('level')} error={errors.level?.message} />
          </div>
          <div className="pt-6">
            <Button type="submit" isLoading={createClass.isPending}>
              Add class
            </Button>
          </div>
        </form>
        {createClass.isError && (
          <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(createClass.error)}</p>
        )}
      </Card>

      {classes.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : classes.data && classes.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.data.map((cls) => (
            <Card key={cls.id} className="flex items-center justify-between">
              <Link to={`/academics/classes/${cls.id}`} className="block">
                <p className="font-semibold text-brand-700">{cls.name}</p>
                <p className="text-xs text-slate-500">
                  {cls._count.sections} section{cls._count.sections === 1 ? '' : 's'} ·{' '}
                  {cls._count.classSubjects} subject{cls._count.classSubjects === 1 ? '' : 's'}
                </p>
              </Link>
              <Button
                variant="ghost"
                isLoading={deleteClass.isPending && deleteClass.variables === cls.id}
                onClick={() => deleteClass.mutate(cls.id)}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No classes yet.</p>
      )}
    </div>
  );
}
