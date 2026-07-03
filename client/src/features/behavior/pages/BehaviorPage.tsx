import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStudents } from '@/features/students/useStudents';
import { useBehaviorList, useCreateBehavior, useDeleteBehavior } from '../useBehavior';
import { BEHAVIOR_TYPES, type BehaviorType } from '../behavior.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const typeBadge: Record<BehaviorType, string> = {
  MERIT: 'bg-green-50 text-green-700',
  DEMERIT: 'bg-red-50 text-red-700',
  INCIDENT: 'bg-amber-50 text-amber-700',
};

const addSchema = z.object({
  studentId: z.string().uuid('Select a student'),
  type: z.enum(['MERIT', 'DEMERIT', 'INCIDENT']),
  title: z.string().trim().min(1, 'Required').max(160),
  points: z.coerce.number().int().min(0).max(1000),
  description: z.string().trim().max(2000).optional(),
});

type AddValues = z.infer<typeof addSchema>;

/** Applies the sign convention: merits positive, demerits negative, incidents 0. */
const signedPoints = (type: BehaviorType, points: number): number => {
  if (type === 'MERIT') return Math.abs(points);
  if (type === 'DEMERIT') return -Math.abs(points);
  return 0;
};

export function BehaviorPage() {
  const [studentSearch, setStudentSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BehaviorType | ''>('');
  const [page, setPage] = useState(1);

  const students = useStudents({ limit: 20, search: studentSearch || undefined });
  const list = useBehaviorList({ page, limit: 10, type: typeFilter || undefined });
  const create = useCreateBehavior();
  const remove = useDeleteBehavior();
  const meta = list.data?.meta;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { type: 'MERIT', points: 1 },
  });
  const selectedType = watch('type');

  const onAdd = handleSubmit((values) => {
    create.mutate(
      {
        studentId: values.studentId,
        type: values.type,
        title: values.title,
        points: signedPoints(values.type, values.points),
        description: values.description?.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Behaviour record added');
          reset({ type: values.type, points: values.type === 'INCIDENT' ? 0 : 1 });
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  });

  const doDelete = (id: string): void => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Record deleted'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Behaviour &amp; Discipline</h1>
        <p className="text-slate-500">Log merits, demerits, and incident notes against students.</p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Add a record</h2>
        <form onSubmit={onAdd} noValidate className="space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-64">
              <TextField
                label="Find student"
                placeholder="Search by name or admission no."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  // Clear the selection so a now-hidden student isn't silently submitted.
                  setValue('studentId', '');
                }}
              />
            </div>
            <div className="w-72">
              <Select label="Student" {...register('studentId')} error={errors.studentId?.message}>
                <option value="">Select</option>
                {students.data?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNo})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-40">
              <Select label="Type" {...register('type')}>
                {BEHAVIOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[16rem]">
              <TextField label="Title" {...register('title')} error={errors.title?.message} />
            </div>
            <div className="w-28">
              <TextField
                label="Points"
                type="number"
                min={0}
                disabled={selectedType === 'INCIDENT'}
                {...register('points')}
                error={errors.points?.message}
              />
            </div>
          </div>
          <TextField label="Description (optional)" {...register('description')} />
          <Button type="submit" isLoading={create.isPending}>Add record</Button>
        </form>
      </Card>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Select
            label="Filter by type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as BehaviorType | '');
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {BEHAVIOR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {list.isLoading ? (
          <Spinner />
        ) : list.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(list.error)}</p>
        ) : list.data && list.data.items.length === 0 ? (
          <EmptyState title="No records" description="Logged behaviour records will appear here." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.student.firstName} {r.student.lastName}</p>
                    <p className="text-xs text-slate-400">{r.student.admissionNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[r.type]}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.title}
                    {r.description && <p className="text-xs text-slate-400">{r.description}</p>}
                  </td>
                  <td className={`px-4 py-3 font-medium tabular-nums ${r.points < 0 ? 'text-red-600' : r.points > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                    {r.points > 0 ? `+${r.points}` : r.points}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.occurredOn.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      className="py-1"
                      onClick={() => doDelete(r.id)}
                      isLoading={remove.isPending && remove.variables === r.id}
                    >
                      Delete
                    </Button>
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
