import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateHostel, useHostels } from '../useHostel';
import { HOSTEL_TYPES, type HostelType } from '../hostel.types';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(['BOYS', 'GIRLS', 'MIXED']),
  wardenName: z.string().optional(),
  monthlyFee: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof schema>;

export function HostelsListPage() {
  const hostels = useHostels();
  const create = useCreateHostel();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'MIXED', monthlyFee: 0 },
  });

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync({
      name: values.name,
      type: values.type as HostelType,
      wardenName: values.wardenName?.trim() || undefined,
      monthlyFee: values.monthlyFee,
    });
    reset({ type: values.type, monthlyFee: 0, name: '', wardenName: '' });
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hostels</h1>
        <p className="text-slate-500">Buildings, rooms, and boarders.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-40"><TextField label="Name" {...register('name')} error={errors.name?.message} /></div>
          <div className="w-32">
            <Select label="Type" {...register('type')}>
              {HOSTEL_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </Select>
          </div>
          <div className="w-40"><TextField label="Warden" {...register('wardenName')} /></div>
          <div className="w-28"><TextField label="Monthly fee" type="number" {...register('monthlyFee')} /></div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Add hostel</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      {hostels.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : hostels.data && hostels.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {hostels.data.map((h) => (
            <Card key={h.id}>
              <Link to={`/hostels/${h.id}`} className="block">
                <p className="font-semibold text-brand-700">
                  {h.name} <span className="text-xs font-normal text-slate-400">{h.type}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {h.occupied}/{h.totalBeds} beds occupied · {h.roomCount} rooms · fee {formatAmount(h.monthlyFee)}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No hostels yet.</p>
      )}
    </div>
  );
}
