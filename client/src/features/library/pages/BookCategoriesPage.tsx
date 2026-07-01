import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBookCategories, useCreateBookCategory, useDeleteBookCategory } from '../useLibrary';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({ name: z.string().min(2, 'Name is required') });
type FormValues = z.infer<typeof schema>;

export function BookCategoriesPage() {
  const categories = useBookCategories();
  const create = useCreateBookCategory();
  const remove = useDeleteBookCategory();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync(values.name);
    reset();
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book categories</h1>
        <p className="text-slate-500">Groupings used to organize the catalog.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex items-start gap-3">
          <div className="flex-1">
            <TextField label="Name" placeholder="Fiction" {...register('name')} error={errors.name?.message} />
          </div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Add</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      <Card className="p-0">
        {categories.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : categories.data && categories.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {categories.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-medium">{c.name}</span>
                <Button variant="danger" isLoading={remove.isPending && remove.variables === c.id} onClick={() => remove.mutate(c.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No categories yet.</p>
        )}
      </Card>
    </div>
  );
}
