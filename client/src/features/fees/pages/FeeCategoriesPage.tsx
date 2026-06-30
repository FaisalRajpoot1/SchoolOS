import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateFeeCategory, useDeleteFeeCategory, useFeeCategories } from '../useFees';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function FeeCategoriesPage() {
  const categories = useFeeCategories();
  const createCategory = useCreateFeeCategory();
  const deleteCategory = useDeleteFeeCategory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await createCategory.mutateAsync({
      name: values.name,
      description: values.description?.trim() || undefined,
    });
    reset();
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fee categories</h1>
        <p className="text-slate-500">Labels used on invoice line items.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40">
            <TextField label="Name" placeholder="Tuition" {...register('name')} error={errors.name?.message} />
          </div>
          <div className="flex-1 min-w-40">
            <TextField label="Description (optional)" {...register('description')} />
          </div>
          <div className="pt-6">
            <Button type="submit" isLoading={createCategory.isPending}>
              Add
            </Button>
          </div>
        </form>
        {createCategory.isError && (
          <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(createCategory.error)}</p>
        )}
      </Card>

      <Card className="p-0">
        {categories.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : categories.data && categories.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {categories.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <span className="font-medium">{c.name}</span>
                  {c.description && <span className="ml-2 text-sm text-slate-500">{c.description}</span>}
                </div>
                <Button
                  variant="danger"
                  isLoading={deleteCategory.isPending && deleteCategory.variables === c.id}
                  onClick={() => deleteCategory.mutate(c.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No fee categories yet.</p>
        )}
      </Card>
    </div>
  );
}
