import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAnnouncementsList, useCreateAnnouncement, useDeleteAnnouncement } from '../useAnnouncements';
import { AUDIENCES, type AnnouncementAudience } from '../announcements.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  audience: z.enum(['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'STAFF']),
  pinned: z.boolean().optional(),
  expiresAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ManageAnnouncementsPage() {
  const [page, setPage] = useState(1);
  const list = useAnnouncementsList({ page, limit: 10 });
  const create = useCreateAnnouncement();
  const remove = useDeleteAnnouncement();
  const meta = list.data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { audience: 'ALL' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      title: values.title,
      body: values.body,
      audience: values.audience as AnnouncementAudience,
      pinned: values.pinned,
      expiresAt: values.expiresAt || undefined,
    });
    reset({ audience: values.audience, title: '', body: '', pinned: false, expiresAt: '' });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage announcements</h1>
        <p className="text-slate-500">Post to the notice board.</p>
      </div>

      <Card className="space-y-4">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField label="Title" {...register('title')} error={errors.title?.message} />
          <div className="space-y-1">
            <label htmlFor="body" className="text-sm font-medium text-slate-700">Body</label>
            <textarea id="body" rows={3} {...register('body')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            {errors.body && <p className="text-xs text-red-600">{errors.body.message}</p>}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Select label="Audience" {...register('audience')}>
                {AUDIENCES.map((a) => (<option key={a} value={a}>{a}</option>))}
              </Select>
            </div>
            <div className="w-44">
              <TextField label="Expires (optional)" type="date" {...register('expiresAt')} />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" {...register('pinned')} className="size-4 accent-brand-600" />
              Pin to top
            </label>
            <Button type="submit" isLoading={create.isPending}>Post</Button>
          </div>
          {create.isError && <p className="text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
        </form>
      </Card>

      <Card className="p-0">
        {list.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : list.data && list.data.items.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {list.data.items.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-6 py-3">
                <div>
                  <p className="font-medium">
                    {a.pinned && <span className="mr-1 text-brand-600">📌</span>}
                    {a.title}
                    <span className="ml-2 text-xs text-slate-400">{a.audience}</span>
                  </p>
                  <p className="text-xs text-slate-500">{a.publishedAt.slice(0, 10)}</p>
                </div>
                <Button variant="ghost" isLoading={remove.isPending && remove.variables === a.id} onClick={() => remove.mutate(a.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No announcements yet.</p>
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
