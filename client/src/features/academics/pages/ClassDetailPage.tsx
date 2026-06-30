import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useClass,
  useCreateSection,
  useDeleteSection,
  useSetClassSubjects,
  useSubjects,
} from '../useAcademics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const sectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Capacity must be a number'),
});

type SectionForm = z.infer<typeof sectionSchema>;

export function ClassDetailPage() {
  const { classId = '' } = useParams();
  const detail = useClass(classId);
  const subjects = useSubjects();
  const createSection = useCreateSection(classId);
  const deleteSection = useDeleteSection(classId);
  const setSubjects = useSetClassSubjects(classId);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sync local subject selection whenever the class detail loads/changes.
  useEffect(() => {
    if (detail.data) {
      setSelected(new Set(detail.data.classSubjects.map((cs) => cs.subject.id)));
    }
  }, [detail.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionForm>({ resolver: zodResolver(sectionSchema) });

  const onAddSection = handleSubmit(async (values) => {
    await createSection.mutateAsync({
      name: values.name,
      capacity: values.capacity ? Number(values.capacity) : undefined,
    });
    reset();
  });

  const toggleSubject = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (detail.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (detail.isError || !detail.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(detail.error)}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/academics/classes" className="text-sm text-brand-600">
          ← Back to classes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {detail.data.name}
          {detail.data.level !== null && (
            <span className="ml-2 text-base font-normal text-slate-400">Level {detail.data.level}</span>
          )}
        </h1>
      </div>

      {/* Sections */}
      <Card className="space-y-4">
        <h2 className="font-semibold">Sections</h2>
        {detail.data.sections.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {detail.data.sections.map((section) => (
              <li key={section.id} className="flex items-center justify-between py-2">
                <span>
                  <span className="font-medium">{section.name}</span>
                  {section.capacity !== null && (
                    <span className="ml-2 text-xs text-slate-500">capacity {section.capacity}</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  isLoading={deleteSection.isPending && deleteSection.variables === section.id}
                  onClick={() => deleteSection.mutate(section.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No sections yet.</p>
        )}

        <form onSubmit={onAddSection} noValidate className="flex flex-wrap items-start gap-3 border-t border-slate-100 pt-4">
          <div className="w-32">
            <TextField label="Section" placeholder="A" {...register('name')} error={errors.name?.message} />
          </div>
          <div className="w-32">
            <TextField label="Capacity" placeholder="30" inputMode="numeric" {...register('capacity')} error={errors.capacity?.message} />
          </div>
          <div className="pt-6">
            <Button type="submit" isLoading={createSection.isPending}>
              Add section
            </Button>
          </div>
        </form>
        {createSection.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(createSection.error)}</p>
        )}
      </Card>

      {/* Offered subjects */}
      <Card className="space-y-4">
        <h2 className="font-semibold">Offered subjects</h2>
        {subjects.isLoading ? (
          <p className="text-sm text-slate-500">Loading subjects…</p>
        ) : subjects.data && subjects.data.length > 0 ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.data.map((subject) => (
                <label
                  key={subject.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="size-4 accent-brand-600"
                  />
                  {subject.name}
                  <span className="ml-auto font-mono text-xs text-slate-400">{subject.code}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setSubjects.mutate(Array.from(selected))}
                isLoading={setSubjects.isPending}
              >
                Save subjects
              </Button>
              {setSubjects.isSuccess && <span className="text-sm text-green-700">Saved.</span>}
              {setSubjects.isError && (
                <span className="text-sm text-red-600">{getApiErrorMessage(setSubjects.error)}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            No subjects in the catalog yet.{' '}
            <Link to="/academics/subjects" className="text-brand-600">
              Add subjects
            </Link>
            .
          </p>
        )}
      </Card>
    </div>
  );
}
