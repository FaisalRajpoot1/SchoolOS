import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  useClass,
  useClasses,
  useCreateSection,
  useDeleteSection,
  useSetClassSubjects,
  useSetClassTeacher,
  useSetSubjectTeacher,
  useSubjects,
} from '../useAcademics';
import { useTeacherOptions } from '@/features/teachers/useTeachers';
import { studentsApi } from '@/features/students/students.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

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
  const teachers = useTeacherOptions();
  const setClassTeacher = useSetClassTeacher(classId);
  const setSubjectTeacher = useSetSubjectTeacher(classId);

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
              <li key={section.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-24">
                  <span className="font-medium">{section.name}</span>
                  {section.capacity !== null && (
                    <span className="ml-2 text-xs text-slate-500">capacity {section.capacity}</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label="Class teacher"
                    className="w-44 py-1.5"
                    value={section.classTeacherId ?? ''}
                    onChange={(e) =>
                      setClassTeacher.mutate({
                        sectionId: section.id,
                        teacherId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">No class teacher</option>
                    {teachers.data?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    isLoading={deleteSection.isPending && deleteSection.variables === section.id}
                    onClick={() => deleteSection.mutate(section.id)}
                  >
                    Delete
                  </Button>
                </div>
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

      {/* Subject teachers */}
      {detail.data.classSubjects.length > 0 && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Subject teachers</h2>
          <ul className="divide-y divide-slate-100">
            {detail.data.classSubjects.map((cs) => (
              <li key={cs.id} className="flex items-center justify-between gap-3 py-2">
                <span className="font-medium">{cs.subject.name}</span>
                <Select
                  aria-label={`Teacher for ${cs.subject.name}`}
                  className="w-52 py-1.5"
                  value={cs.teacherId ?? ''}
                  onChange={(e) =>
                    setSubjectTeacher.mutate({
                      subjectId: cs.subject.id,
                      teacherId: e.target.value || null,
                    })
                  }
                >
                  <option value="">No teacher</option>
                  {teachers.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </Select>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <PromoteCard fromClassId={classId} fromClassName={detail.data.name} />
    </div>
  );
}

/** Batch-promote a class's active students to another class, or graduate them. */
function PromoteCard({ fromClassId, fromClassName }: { fromClassId: string; fromClassName: string }) {
  const queryClient = useQueryClient();
  const classes = useClasses();
  const [toClassId, setToClassId] = useState('');
  const [graduate, setGraduate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (): Promise<void> => {
    if (!graduate && !toClassId) return;
    const confirmed = window.confirm(
      graduate
        ? `Graduate all active students of ${fromClassName}? This cannot be undone.`
        : `Promote all active students of ${fromClassName} to the selected class? Their section will be cleared.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const res = await studentsApi.promote({
        fromClassId,
        toClassId: graduate ? undefined : toClassId,
        graduate,
      });
      toast.success(
        res.graduated
          ? `Graduated ${res.moved} student(s)`
          : `Promoted ${res.moved} student(s)`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">Promote / graduate students</h2>
        <p className="text-sm text-slate-500">
          Moves all <span className="font-medium">active</span> students of {fromClassName} at once.
          Promotion clears their section (re-assign in the target class).
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <Select
            label="Promote to class"
            value={toClassId}
            onChange={(e) => setToClassId(e.target.value)}
            disabled={graduate}
          >
            <option value="">Select target class</option>
            {classes.data
              ?.filter((c) => c.id !== fromClassId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input type="checkbox" checked={graduate} onChange={(e) => setGraduate(e.target.checked)} />
          Graduate instead
        </label>
        <Button disabled={!graduate && !toClassId} isLoading={busy} onClick={run}>
          {graduate ? 'Graduate' : 'Promote'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
