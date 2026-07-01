import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateAssignment } from '../useAssignments';
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
  instructions: z.string().optional(),
  maxMarks: z.coerce.number().int().min(1, 'Required'),
  dueDate: z.string().min(1, 'Due date is required'),
  criteria: z
    .array(z.object({ label: z.string().min(1, 'Required'), maxPoints: z.coerce.number().int().min(1) }))
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateAssignmentPage() {
  const navigate = useNavigate();
  const classes = useClasses();
  const createAssignment = useCreateAssignment();
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { maxMarks: 100, criteria: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: 'criteria' });

  const classId = watch('classId');
  const classDetail = useClass(classId ?? '');
  const sections = classId ? (classDetail.data?.sections ?? []) : [];
  const subjects = classId ? (classDetail.data?.classSubjects.map((cs) => cs.subject) ?? []) : [];

  const onSubmit = handleSubmit(async (values) => {
    const assignment = await createAssignment.mutateAsync({
      classId: values.classId,
      sectionId: values.sectionId,
      subjectId: values.subjectId || undefined,
      title: values.title,
      description: values.description?.trim() || undefined,
      instructions: values.instructions?.trim() || undefined,
      maxMarks: values.maxMarks,
      dueDate: values.dueDate,
      criteria: values.criteria?.filter((c) => c.label.trim()),
    });
    navigate(`/assignments/${assignment.id}`, { replace: true });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/assignments" className="text-sm text-brand-600">← Back to assignments</Link>
        <h1 className="mt-2 text-2xl font-bold">New assignment</h1>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Class" {...register('classId')} error={errors.classId?.message}>
              <option value="">Select</option>
              {classes.data?.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </Select>
            <Select label="Section" {...register('sectionId')} error={errors.sectionId?.message} disabled={!classId}>
              <option value="">Select</option>
              {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </Select>
            <Select label="Subject (optional)" {...register('subjectId')} disabled={!classId}>
              <option value="">—</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </Select>
          </div>
          <TextField label="Title" {...register('title')} error={errors.title?.message} />
          <div className="space-y-1">
            <label htmlFor="instructions" className="text-sm font-medium text-slate-700">Instructions</label>
            <textarea id="instructions" rows={3} {...register('instructions')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Max marks" type="number" {...register('maxMarks')} error={errors.maxMarks?.message} />
            <TextField label="Due date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Rubric (optional)</h2>
            <Button type="button" variant="secondary" onClick={() => append({ label: '', maxPoints: 10 })}>
              + Add criterion
            </Button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-slate-500">No rubric criteria.</p>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 items-start gap-2">
                <div className="col-span-8">
                  <TextField aria-label="Criterion" placeholder="e.g. Accuracy" {...register(`criteria.${index}.label`)} />
                </div>
                <div className="col-span-3">
                  <TextField aria-label="Points" type="number" placeholder="Points" {...register(`criteria.${index}.maxPoints`)} />
                </div>
                <div className="col-span-1 pt-1">
                  <Button type="button" variant="ghost" onClick={() => remove(index)}>✕</Button>
                </div>
              </div>
            ))
          )}
        </Card>

        {createAssignment.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createAssignment.error)}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/assignments')}>Cancel</Button>
          <Button type="submit" isLoading={createAssignment.isPending}>Create assignment</Button>
        </div>
      </form>
    </div>
  );
}
