import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAcademicYears,
  useCreateAcademicYear,
  useDeleteAcademicYear,
  useSetCurrentAcademicYear,
} from '../useAcademicYears';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z
  .object({
    name: z.string().min(2, 'Name is required (e.g. 2025-2026)'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((d) => d.startDate < d.endDate, {
    message: 'Start date must be before end date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

const formatDate = (iso: string): string => iso.slice(0, 10);

export function AcademicYearsPanel() {
  const years = useAcademicYears();
  const createYear = useCreateAcademicYear();
  const setCurrent = useSetCurrentAcademicYear();
  const deleteYear = useDeleteAcademicYear();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await createYear.mutateAsync(values);
    reset();
  });

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-semibold">Academic years</h2>
        <p className="text-sm text-slate-500">Define sessions and mark the current one.</p>
      </div>

      {years.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : years.data && years.data.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {years.data.map((year) => (
            <li key={year.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {year.name}
                  {year.isCurrent && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(year.startDate)} → {formatDate(year.endDate)}
                </p>
              </div>
              <div className="flex gap-2">
                {!year.isCurrent && (
                  <Button
                    variant="secondary"
                    isLoading={setCurrent.isPending && setCurrent.variables === year.id}
                    onClick={() => setCurrent.mutate(year.id)}
                  >
                    Set current
                  </Button>
                )}
                {!year.isCurrent && (
                  <Button
                    variant="danger"
                    isLoading={deleteYear.isPending && deleteYear.variables === year.id}
                    onClick={() => deleteYear.mutate(year.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No academic years yet.</p>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-slate-700">Add a new academic year</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Name" placeholder="2025-2026" {...register('name')} error={errors.name?.message} />
          <TextField label="Start date" type="date" {...register('startDate')} error={errors.startDate?.message} />
          <TextField label="End date" type="date" {...register('endDate')} error={errors.endDate?.message} />
        </div>
        {createYear.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(createYear.error)}</p>
        )}
        <Button type="submit" isLoading={createYear.isPending}>
          Add academic year
        </Button>
      </form>
    </Card>
  );
}
