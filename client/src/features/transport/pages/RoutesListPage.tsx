import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRoute, useRoutes, useVehicles } from '../useTransport';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  fee: z.coerce.number().int().min(0),
  vehicleId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function RoutesListPage() {
  const routes = useRoutes();
  const vehicles = useVehicles();
  const create = useCreateRoute();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fee: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({ name: values.name, fee: values.fee, vehicleId: values.vehicleId || undefined });
    reset({ fee: 0, name: '', vehicleId: '' });
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routes</h1>
          <p className="text-slate-500">Transport routes, stops, and rider allocations.</p>
        </div>
        <Link to="/transport/vehicles"><Button variant="secondary">Vehicles</Button></Link>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40"><TextField label="Route name" {...register('name')} error={errors.name?.message} /></div>
          <div className="w-28"><TextField label="Monthly fee" type="number" {...register('fee')} /></div>
          <div className="w-44">
            <Select label="Vehicle" {...register('vehicleId')}>
              <option value="">—</option>
              {vehicles.data?.map((v) => (<option key={v.id} value={v.id}>{v.registrationNo}</option>))}
            </Select>
          </div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Add route</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      {routes.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : routes.data && routes.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {routes.data.map((r) => (
            <Card key={r.id}>
              <Link to={`/transport/routes/${r.id}`} className="block">
                <p className="font-semibold text-brand-700">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {r.vehicle ? r.vehicle.registrationNo : 'No vehicle'} · {r._count.stops} stops ·{' '}
                  {r._count.allocations} riders · fee {formatAmount(r.fee)}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No routes yet.</p>
      )}
    </div>
  );
}
