import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSupplier, useDeleteSupplier, useSuppliers } from '../useInventory';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function SuppliersPage() {
  const suppliers = useSuppliers();
  const create = useCreateSupplier();
  const remove = useDeleteSupplier();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      name: values.name,
      contactPerson: values.contactPerson?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    });
    reset();
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-slate-500">Vendors for inventory purchases.</p>
        </div>
        <Link to="/inventory/items"><Button variant="secondary">Items</Button></Link>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40"><TextField label="Name" {...register('name')} error={errors.name?.message} /></div>
          <div className="w-40"><TextField label="Contact person" {...register('contactPerson')} /></div>
          <div className="w-36"><TextField label="Phone" {...register('phone')} /></div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Add</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      <Card className="p-0">
        {suppliers.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : suppliers.data && suppliers.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {suppliers.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {s.contactPerson ?? ''}{s.phone ? ` · ${s.phone}` : ''}
                  </span>
                  {s._count && <span className="ml-2 text-xs text-slate-400">{s._count.items} items</span>}
                </div>
                <Button variant="danger" isLoading={remove.isPending && remove.variables === s.id} onClick={() => remove.mutate(s.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No suppliers yet.</p>
        )}
      </Card>
    </div>
  );
}
