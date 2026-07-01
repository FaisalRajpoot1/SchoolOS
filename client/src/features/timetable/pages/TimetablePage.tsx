import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClass, useClasses } from '@/features/academics/useAcademics';
import { useTeacherOptions } from '@/features/teachers/useTeachers';
import { useCreateSlot, useDeleteSlot, useTimetable } from '../useTimetable';
import { DAYS, type DayOfWeek, type TimetableSlot } from '../timetable.types';
import { minutesToTime, timeToMinutes } from '../time';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const dayLabel: Record<DayOfWeek, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

const addSchema = z
  .object({
    dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
    start: z.string().min(1, 'Required'),
    end: z.string().min(1, 'Required'),
    subjectId: z.string().optional(),
    teacherId: z.string().optional(),
    room: z.string().optional(),
  })
  .refine((d) => d.start < d.end, { message: 'Start must be before end', path: ['end'] });

type AddValues = z.infer<typeof addSchema>;

function DayColumn({
  day,
  slots,
  showSection,
  onDelete,
  deletingId,
}: {
  day: DayOfWeek;
  slots: TimetableSlot[];
  showSection: boolean;
  onDelete?: (id: string) => void;
  deletingId?: string;
}) {
  return (
    <Card className="space-y-2">
      <p className="font-semibold">{dayLabel[day]}</p>
      {slots.length === 0 ? (
        <p className="text-sm text-slate-400">—</p>
      ) : (
        slots.map((slot) => (
          <div key={slot.id} className="rounded-lg border border-slate-200 p-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium tabular-nums">
                {minutesToTime(slot.startMinute)}–{minutesToTime(slot.endMinute)}
              </span>
              {onDelete && (
                <button
                  onClick={() => onDelete(slot.id)}
                  disabled={deletingId === slot.id}
                  className="text-xs text-red-600 disabled:opacity-50"
                >
                  remove
                </button>
              )}
            </div>
            <p className="text-slate-700">{slot.subject?.name ?? 'Subject TBD'}</p>
            <p className="text-xs text-slate-500">
              {showSection && `${slot.section.class.name}/${slot.section.name} · `}
              {slot.teacher ? `${slot.teacher.firstName} ${slot.teacher.lastName}` : 'No teacher'}
              {slot.room ? ` · Room ${slot.room}` : ''}
            </p>
          </div>
        ))
      )}
    </Card>
  );
}

export function TimetablePage() {
  const [mode, setMode] = useState<'section' | 'teacher'>('section');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const classes = useClasses();
  const classDetail = useClass(classId);
  const sections = classId ? (classDetail.data?.sections ?? []) : [];
  const subjects = classId ? (classDetail.data?.classSubjects.map((cs) => cs.subject) ?? []) : [];
  const teachers = useTeacherOptions();

  const isSection = mode === 'section';
  const activeId = isSection ? sectionId : teacherId;
  const timetable = useTimetable(
    isSection ? { sectionId } : { teacherId },
    !!activeId,
  );

  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddValues>({ resolver: zodResolver(addSchema), defaultValues: { dayOfWeek: 'MON' } });

  const onAdd = handleSubmit(async (values) => {
    await createSlot.mutateAsync({
      sectionId,
      dayOfWeek: values.dayOfWeek,
      startMinute: timeToMinutes(values.start),
      endMinute: timeToMinutes(values.end),
      subjectId: values.subjectId || undefined,
      teacherId: values.teacherId || undefined,
      room: values.room?.trim() || undefined,
    });
    reset({ dayOfWeek: values.dayOfWeek, start: '', end: '', subjectId: '', teacherId: '', room: '' });
  });

  const slotsByDay = (day: DayOfWeek): TimetableSlot[] =>
    (timetable.data ?? []).filter((s) => s.dayOfWeek === day);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Timetable</h1>
        <p className="text-slate-500">Weekly schedule with clash detection.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="View"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'section' | 'teacher')}
          >
            <option value="section">By section</option>
            <option value="teacher">By teacher</option>
          </Select>
        </div>
        {isSection ? (
          <>
            <div className="w-40">
              <Select label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}>
                <option value="">Select</option>
                {classes.data?.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </Select>
            </div>
            <div className="w-40">
              <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
                <option value="">Select</option>
                {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </Select>
            </div>
          </>
        ) : (
          <div className="w-56">
            <Select label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Select</option>
              {teachers.data?.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {isSection && sectionId && (
        <Card className="space-y-3">
          <h2 className="font-semibold">Add slot</h2>
          <form onSubmit={onAdd} noValidate className="flex flex-wrap items-start gap-3">
            <div className="w-32">
              <Select label="Day" {...register('dayOfWeek')}>
                {DAYS.map((d) => (<option key={d} value={d}>{dayLabel[d]}</option>))}
              </Select>
            </div>
            <div className="w-28"><TextField label="Start" type="time" {...register('start')} error={errors.start?.message} /></div>
            <div className="w-28"><TextField label="End" type="time" {...register('end')} error={errors.end?.message} /></div>
            <div className="w-40">
              <Select label="Subject" {...register('subjectId')}>
                <option value="">—</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </Select>
            </div>
            <div className="w-44">
              <Select label="Teacher" {...register('teacherId')}>
                <option value="">—</option>
                {teachers.data?.map((t) => (<option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>))}
              </Select>
            </div>
            <div className="w-24"><TextField label="Room" {...register('room')} /></div>
            <div className="pt-6"><Button type="submit" isLoading={createSlot.isPending}>Add</Button></div>
          </form>
          {createSlot.isError && (
            <p className="text-sm text-red-600">{getApiErrorMessage(createSlot.error)}</p>
          )}
        </Card>
      )}

      {!activeId ? (
        <p className="text-sm text-slate-500">
          {isSection ? 'Select a class and section.' : 'Select a teacher.'}
        </p>
      ) : timetable.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              slots={slotsByDay(day)}
              showSection={!isSection}
              onDelete={isSection ? (slotId) => deleteSlot.mutate(slotId) : undefined}
              deletingId={deleteSlot.variables}
            />
          ))}
        </div>
      )}
    </div>
  );
}
