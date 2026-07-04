import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateEmployee } from '../useHr';
import { EMPLOYMENT_TYPES, type EmploymentType } from '../hr.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  employeeCode: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
  salary: z.string().optional().refine((v) => !v || /^\d+$/.test(v), 'Must be a number'),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankRoutingNo: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const trimmed = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

export function AddEmployeePage() {
  const navigate = useNavigate();
  const create = useCreateEmployee();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employmentType: 'FULL_TIME' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const employee = await create.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      employeeCode: trimmed(values.employeeCode),
      email: trimmed(values.email),
      phone: trimmed(values.phone),
      designation: trimmed(values.designation),
      department: trimmed(values.department),
      employmentType: values.employmentType as EmploymentType,
      salary: values.salary ? Number(values.salary) : undefined,
      bankName: trimmed(values.bankName),
      bankAccountName: trimmed(values.bankAccountName),
      bankAccountNo: trimmed(values.bankAccountNo),
      bankRoutingNo: trimmed(values.bankRoutingNo),
    });
    navigate(`/hr/employees/${employee.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/hr/employees" className="text-sm text-brand-600">← Back to employees</Link>
        <h1 className="mt-2 text-2xl font-bold">Add employee</h1>
        <p className="text-slate-500">Leave the code blank to auto-generate one.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" {...register('firstName')} error={errors.firstName?.message} />
            <TextField label="Last name" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Employee code (optional)" {...register('employeeCode')} />
            <TextField label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <TextField label="Phone" {...register('phone')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Designation" {...register('designation')} />
            <TextField label="Department" {...register('department')} />
            <Select label="Employment type" {...register('employmentType')}>
              {EMPLOYMENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </Select>
          </div>
          <div className="w-40">
            <TextField label="Salary (monthly)" inputMode="numeric" {...register('salary')} error={errors.salary?.message} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Bank details (for salary transfer)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Bank name" {...register('bankName')} />
            <TextField label="Account holder name" {...register('bankAccountName')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Account number" {...register('bankAccountNo')} />
            <TextField label="Routing / IFSC" {...register('bankRoutingNo')} />
          </div>
        </Card>

        {create.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{getApiErrorMessage(create.error)}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/hr/employees')}>Cancel</Button>
          <Button type="submit" isLoading={create.isPending}>Add employee</Button>
        </div>
      </form>
    </div>
  );
}
