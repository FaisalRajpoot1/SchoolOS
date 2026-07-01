import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBookCategories, useBooks, useCreateBook } from '../useLibrary';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  isbn: z.string().optional(),
  categoryId: z.string().optional(),
  totalCopies: z.coerce.number().int().min(1, 'Min 1'),
});
type FormValues = z.infer<typeof schema>;

export function BooksListPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  const categories = useBookCategories();
  const query = useBooks({ page, limit: 10, search: search || undefined, categoryId: categoryId || undefined });
  const createBook = useCreateBook();
  const meta = query.data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { totalCopies: 1 },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createBook.mutateAsync({
      title: values.title,
      author: values.author?.trim() || undefined,
      isbn: values.isbn?.trim() || undefined,
      categoryId: values.categoryId || undefined,
      totalCopies: values.totalCopies,
    });
    reset({ totalCopies: 1, title: '', author: '', isbn: '', categoryId: '' });
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-slate-500">Catalog and copy availability.</p>
        </div>
        <Link to="/library/issues"><Button variant="secondary">Issued books</Button></Link>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40"><TextField label="Title" {...register('title')} error={errors.title?.message} /></div>
          <div className="w-40"><TextField label="Author" {...register('author')} /></div>
          <div className="w-36"><TextField label="ISBN" {...register('isbn')} /></div>
          <div className="w-36">
            <Select label="Category" {...register('categoryId')}>
              <option value="">—</option>
              {categories.data?.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </Select>
          </div>
          <div className="w-20"><TextField label="Copies" type="number" {...register('totalCopies')} error={errors.totalCopies?.message} /></div>
          <div className="pt-6"><Button type="submit" isLoading={createBook.isPending}>Add book</Button></div>
        </form>
        {createBook.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(createBook.error)}</p>}
      </Card>

      <Card className="flex flex-wrap items-end gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by title, author, or ISBN…"
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="w-40">
          <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.data?.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {query.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No books found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Available</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">
                    <Link to={`/library/books/${b.id}`} className="text-brand-700">{b.title}</Link>
                    {b.isbn && <span className="ml-2 font-mono text-xs text-slate-400">{b.isbn}</span>}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{b.author ?? '—'}</td>
                  <td className="px-6 py-3 text-slate-600">{b.category?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{b.availableCopies}/{b.totalCopies}</td>
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
