import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateTeacher } from '../useTeachers';
import type { CreateTeacherPayload } from '../teachers.types';
import type { Gender } from '@/features/students/students.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  employeeNo: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(['', 'MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.string().optional().refine((v) => !v || /^\d+$/.test(v), 'Must be a number'),
  salary: z.string().optional().refine((v) => !v || /^\d+$/.test(v), 'Must be a number'),
  joiningDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const trimmed = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

export function AddTeacherPage() {
  const navigate = useNavigate();
  const createTeacher = useCreateTeacher();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateTeacherPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      employeeNo: trimmed(values.employeeNo),
      phone: trimmed(values.phone),
      gender: values.gender ? (values.gender as Gender) : undefined,
      dateOfBirth: trimmed(values.dateOfBirth),
      qualification: trimmed(values.qualification),
      experienceYears: values.experienceYears ? Number(values.experienceYears) : undefined,
      salary: values.salary ? Number(values.salary) : undefined,
      joiningDate: trimmed(values.joiningDate),
    };
    const teacher = await createTeacher.mutateAsync(payload);
    navigate(`/teachers/${teacher.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/teachers" className="text-sm text-brand-600">
          ← Back to teachers
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Add teacher</h1>
        <p className="text-slate-500">Creates a staff record and a TEACHER login account.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold">Identity & login</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" {...register('firstName')} error={errors.firstName?.message} />
            <TextField label="Last name" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email (login)" type="email" autoComplete="off" {...register('email')} error={errors.email?.message} />
            <TextField label="Temporary password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          </div>
          <TextField label="Employee # (optional, auto-generated)" {...register('employeeNo')} />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Profile</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Phone" {...register('phone')} />
            <Select label="Gender" {...register('gender')}>
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
            <TextField label="Date of birth" type="date" {...register('dateOfBirth')} />
          </div>
          <TextField label="Qualification" placeholder="M.Sc. Mathematics" {...register('qualification')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Experience (years)" inputMode="numeric" {...register('experienceYears')} error={errors.experienceYears?.message} />
            <TextField label="Salary (monthly)" inputMode="numeric" {...register('salary')} error={errors.salary?.message} />
            <TextField label="Joining date" type="date" {...register('joiningDate')} />
          </div>
        </Card>

        {createTeacher.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createTeacher.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/teachers')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createTeacher.isPending}>
            Add teacher
          </Button>
        </div>
      </form>
    </div>
  );
}
