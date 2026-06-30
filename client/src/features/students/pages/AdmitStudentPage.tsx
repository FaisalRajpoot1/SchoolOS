import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateStudent } from '../useStudents';
import type { CreateStudentPayload, Gender, GuardianPayload } from '../students.types';
import { useClass, useClasses } from '@/features/academics/useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  admissionNo: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['', 'MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianFirstName: z.string().optional(),
  guardianLastName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const trimmed = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

export function AdmitStudentPage() {
  const navigate = useNavigate();
  const classes = useClasses();
  const createStudent = useCreateStudent();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedClassId = watch('classId');
  const classDetail = useClass(selectedClassId ?? '');
  const sections = selectedClassId ? (classDetail.data?.sections ?? []) : [];

  const onSubmit = handleSubmit(async (values) => {
    const guardian: GuardianPayload | undefined =
      values.guardianFirstName && values.guardianLastName && values.guardianRelation
        ? {
            relation: values.guardianRelation,
            firstName: values.guardianFirstName,
            lastName: values.guardianLastName,
            phone: trimmed(values.guardianPhone),
            email: trimmed(values.guardianEmail),
            isPrimary: true,
          }
        : undefined;

    const payload: CreateStudentPayload = {
      admissionNo: trimmed(values.admissionNo),
      firstName: values.firstName,
      lastName: values.lastName,
      gender: values.gender ? (values.gender as Gender) : undefined,
      dateOfBirth: trimmed(values.dateOfBirth),
      email: trimmed(values.email),
      phone: trimmed(values.phone),
      address: trimmed(values.address),
      classId: trimmed(values.classId),
      sectionId: trimmed(values.sectionId),
      guardians: guardian ? [guardian] : undefined,
    };

    const student = await createStudent.mutateAsync(payload);
    navigate(`/students/${student.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/students" className="text-sm text-brand-600">
          ← Back to students
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Admit student</h1>
        <p className="text-slate-500">Leave admission number blank to auto-generate one.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold">Personal details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" {...register('firstName')} error={errors.firstName?.message} />
            <TextField label="Last name" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Admission # (optional)" {...register('admissionNo')} />
            <Select label="Gender" {...register('gender')}>
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
            <TextField label="Date of birth" type="date" {...register('dateOfBirth')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <TextField label="Phone" {...register('phone')} />
          </div>
          <TextField label="Address" {...register('address')} />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Enrollment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Class" {...register('classId')}>
              <option value="">—</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select label="Section" {...register('sectionId')} disabled={!selectedClassId}>
              <option value="">—</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Primary guardian (optional)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Relation" placeholder="Father" {...register('guardianRelation')} />
            <TextField label="First name" {...register('guardianFirstName')} />
            <TextField label="Last name" {...register('guardianLastName')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Phone" {...register('guardianPhone')} />
            <TextField label="Email" type="email" {...register('guardianEmail')} error={errors.guardianEmail?.message} />
          </div>
        </Card>

        {createStudent.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createStudent.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/students')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createStudent.isPending}>
            Admit student
          </Button>
        </div>
      </form>
    </div>
  );
}
