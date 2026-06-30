import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateHomework } from '../useHomework';
import { useClass, useClasses } from '@/features/academics/useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({
  classId: z.string().uuid('Select a class'),
  sectionId: z.string().uuid('Select a section'),
  subjectId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  attachmentUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  dueDate: z.string().min(1, 'Due date is required'),
});

type FormValues = z.infer<typeof schema>;

export function CreateHomeworkPage() {
  const navigate = useNavigate();
  const classes = useClasses();
  const createHomework = useCreateHomework();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const classId = watch('classId');
  const classDetail = useClass(classId ?? '');
  const sections = classId ? (classDetail.data?.sections ?? []) : [];
  const subjects = classId ? (classDetail.data?.classSubjects.map((cs) => cs.subject) ?? []) : [];

  const onSubmit = handleSubmit(async (values) => {
    const homework = await createHomework.mutateAsync({
      classId: values.classId,
      sectionId: values.sectionId,
      subjectId: values.subjectId || undefined,
      title: values.title,
      description: values.description?.trim() || undefined,
      attachmentUrl: values.attachmentUrl?.trim() || undefined,
      dueDate: values.dueDate,
    });
    navigate(`/homework/${homework.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/homework" className="text-sm text-brand-600">← Back to homework</Link>
        <h1 className="mt-2 text-2xl font-bold">New homework</h1>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Class" {...register('classId')} error={errors.classId?.message}>
              <option value="">Select</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select label="Section" {...register('sectionId')} error={errors.sectionId?.message} disabled={!classId}>
              <option value="">Select</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select label="Subject (optional)" {...register('subjectId')} disabled={!classId}>
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <TextField label="Title" placeholder="Algebra Worksheet 1" {...register('title')} error={errors.title?.message} />
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Due date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
            <TextField label="Attachment URL (optional)" {...register('attachmentUrl')} error={errors.attachmentUrl?.message} />
          </div>
        </Card>

        {createHomework.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createHomework.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/homework')}>Cancel</Button>
          <Button type="submit" isLoading={createHomework.isPending}>Create homework</Button>
        </div>
      </form>
    </div>
  );
}
