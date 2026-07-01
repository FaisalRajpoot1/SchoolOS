import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateVehicle, useDeleteVehicle, useVehicles } from '../useTransport';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  registrationNo: z.string().min(1, 'Required'),
  model: z.string().optional(),
  capacity: z.coerce.number().int().min(0),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function VehiclesPage() {
  const vehicles = useVehicles();
  const create = useCreateVehicle();
  const remove = useDeleteVehicle();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      registrationNo: values.registrationNo,
      model: values.model?.trim() || undefined,
      capacity: values.capacity,
      driverName: values.driverName?.trim() || undefined,
      driverPhone: values.driverPhone?.trim() || undefined,
    });
    reset({ capacity: 0, registrationNo: '', model: '', driverName: '', driverPhone: '' });
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-slate-500">Buses and their drivers.</p>
        </div>
        <Link to="/transport/routes"><Button variant="secondary">Routes</Button></Link>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="w-32"><TextField label="Reg. no" {...register('registrationNo')} error={errors.registrationNo?.message} /></div>
          <div className="w-40"><TextField label="Model" {...register('model')} /></div>
          <div className="w-24"><TextField label="Capacity" type="number" {...register('capacity')} /></div>
          <div className="w-40"><TextField label="Driver" {...register('driverName')} /></div>
          <div className="w-36"><TextField label="Driver phone" {...register('driverPhone')} /></div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Add</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      <Card className="p-0">
        {vehicles.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : vehicles.data && vehicles.data.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Reg. no</th>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3 text-right">Capacity</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {vehicles.data.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-medium">{v.registrationNo}</td>
                  <td className="px-6 py-3 text-slate-600">{v.model ?? '—'}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {v.driverName ?? '—'}
                    {v.driverPhone ? ` · ${v.driverPhone}` : ''}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">{v.capacity}</td>
                  <td className="px-6 py-3 text-right">
                    <Button variant="ghost" isLoading={remove.isPending && remove.variables === v.id} onClick={() => remove.mutate(v.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-sm text-slate-500">No vehicles yet.</p>
        )}
      </Card>
    </div>
  );
}
