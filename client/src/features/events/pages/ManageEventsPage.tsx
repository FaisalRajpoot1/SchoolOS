import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateEvent, useDeleteEvent, useEventsList } from '../useEvents';
import { EVENT_AUDIENCES, EVENT_TYPES, type EventAudience, type EventType } from '../events.types';
import { formatEventWhen } from '../format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['GENERAL', 'HOLIDAY', 'EXAM', 'PTM', 'COMPETITION', 'SPORTS']),
  audience: z.enum(['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF']),
  startDate: z.string().min(1, 'Start is required'),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  allDay: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ManageEventsPage() {
  const [page, setPage] = useState(1);
  const list = useEventsList({ page, limit: 10 });
  const create = useCreateEvent();
  const remove = useDeleteEvent();
  const meta = list.data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'GENERAL', audience: 'ALL', allDay: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      title: values.title,
      type: values.type as EventType,
      audience: values.audience as EventAudience,
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      location: values.location?.trim() || undefined,
      description: values.description?.trim() || undefined,
      allDay: values.allDay,
    });
    reset({ type: values.type, audience: values.audience, allDay: true, title: '', startDate: '', endDate: '', location: '', description: '' });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage events</h1>
        <p className="text-slate-500">Add to the school calendar.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField label="Title" {...register('title')} error={errors.title?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" {...register('type')}>
              {EVENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </Select>
            <Select label="Audience" {...register('audience')}>
              {EVENT_AUDIENCES.map((a) => (<option key={a} value={a}>{a}</option>))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Start" type="datetime-local" {...register('startDate')} error={errors.startDate?.message} />
            <TextField label="End (optional)" type="datetime-local" {...register('endDate')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Location (optional)" {...register('location')} />
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" {...register('allDay')} className="size-4 accent-brand-600" />
              All-day
            </label>
          </div>
          <TextField label="Description (optional)" {...register('description')} />
          {create.isError && <p className="text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
          <div className="flex justify-end"><Button type="submit" isLoading={create.isPending}>Add event</Button></div>
        </form>
      </Card>

      <Card className="p-0">
        {list.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : list.data && list.data.items.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {list.data.items.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-6 py-3">
                <div>
                  <p className="font-medium">{e.title} <span className="ml-2 text-xs text-slate-400">{e.type}</span></p>
                  <p className="text-xs text-slate-500">{formatEventWhen(e)}</p>
                </div>
                <Button variant="ghost" isLoading={remove.isPending && remove.variables === e.id} onClick={() => remove.mutate(e.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No events yet.</p>
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
