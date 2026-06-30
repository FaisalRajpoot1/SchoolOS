import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateSchool } from '../useSchools';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(2, 'School name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
  adminEmail: z.string().email('Enter a valid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function CreateSchoolPage() {
  const navigate = useNavigate();
  const createSchool = useCreateSchool();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await createSchool.mutateAsync({
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      admin: {
        firstName: values.adminFirstName,
        lastName: values.adminLastName,
        email: values.adminEmail,
        password: values.adminPassword,
      },
    });
    navigate('/schools', { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/schools" className="text-sm text-brand-600">
          ← Back to schools
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Create school</h1>
        <p className="text-slate-500">Provision a new tenant and its first administrator.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold">School details</h2>
          <TextField label="School name" {...register('name')} error={errors.name?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email (optional)" type="email" {...register('email')} error={errors.email?.message} />
            <TextField label="Phone (optional)" {...register('phone')} error={errors.phone?.message} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">First administrator</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" {...register('adminFirstName')} error={errors.adminFirstName?.message} />
            <TextField label="Last name" {...register('adminLastName')} error={errors.adminLastName?.message} />
          </div>
          <TextField label="Email" type="email" autoComplete="off" {...register('adminEmail')} error={errors.adminEmail?.message} />
          <TextField
            label="Temporary password"
            type="password"
            autoComplete="new-password"
            {...register('adminPassword')}
            error={errors.adminPassword?.message}
          />
        </Card>

        {createSchool.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createSchool.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/schools')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createSchool.isPending}>
            Create school
          </Button>
        </div>
      </form>
    </div>
  );
}
