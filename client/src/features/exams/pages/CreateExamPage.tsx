import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateExam } from '../useExams';
import { useClasses } from '@/features/academics/useAcademics';
import { useAcademicYears } from '@/features/academicYears/useAcademicYears';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  classId: z.string().uuid('Select a class'),
  academicYearId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateExamPage() {
  const navigate = useNavigate();
  const classes = useClasses();
  const years = useAcademicYears();
  const createExam = useCreateExam();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    const exam = await createExam.mutateAsync({
      name: values.name,
      classId: values.classId,
      academicYearId: values.academicYearId || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    });
    navigate(`/exams/${exam.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/exams" className="text-sm text-brand-600">← Back to exams</Link>
        <h1 className="mt-2 text-2xl font-bold">New exam</h1>
        <p className="text-slate-500">
          Subjects are added automatically from the class's offered subjects.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <TextField label="Exam name" placeholder="Mid-Term" {...register('name')} error={errors.name?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Class" {...register('classId')} error={errors.classId?.message}>
              <option value="">Select class</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select label="Academic year (optional)" {...register('academicYearId')}>
              <option value="">—</option>
              {years.data?.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Start date (optional)" type="date" {...register('startDate')} />
            <TextField label="End date (optional)" type="date" {...register('endDate')} />
          </div>
        </Card>

        {createExam.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createExam.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/exams')}>Cancel</Button>
          <Button type="submit" isLoading={createExam.isPending}>Create exam</Button>
        </div>
      </form>
    </div>
  );
}
