import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStudents } from '@/features/students/useStudents';
import {
  useCreateVisit,
  useDeleteVisit,
  useInfirmaryVisits,
  useMedicalProfile,
  useUpsertProfile,
} from '../useMedical';
import {
  BLOOD_GROUPS,
  VISIT_OUTCOMES,
  type MedicalProfile,
  type VisitOutcome,
} from '../medical.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const outcomeBadge: Record<VisitOutcome, string> = {
  RESOLVED: 'bg-green-50 text-green-700',
  SENT_HOME: 'bg-amber-50 text-amber-700',
  REFERRED: 'bg-blue-50 text-blue-700',
  MONITORING: 'bg-slate-100 text-slate-600',
};

// ---- Medical profile editor ----

const numOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v));
const strOrNull = (v: string | undefined): string | null => (v?.trim() ? v.trim() : null);

const profileToForm = (p: MedicalProfile | null) => ({
  bloodGroup: p?.bloodGroup ?? '',
  heightCm: p?.heightCm != null ? String(p.heightCm) : '',
  weightKg: p?.weightKg != null ? String(p.weightKg) : '',
  allergies: p?.allergies ?? '',
  conditions: p?.conditions ?? '',
  medications: p?.medications ?? '',
  emergencyContactName: p?.emergencyContactName ?? '',
  emergencyContactPhone: p?.emergencyContactPhone ?? '',
  notes: p?.notes ?? '',
});

function ProfileEditor({ studentId, initial }: { studentId: string; initial: MedicalProfile | null }) {
  const upsert = useUpsertProfile(studentId);
  const { register, handleSubmit, reset } = useForm({ defaultValues: profileToForm(initial) });

  const onSave = handleSubmit((v) => {
    upsert.mutate(
      {
        bloodGroup: v.bloodGroup || null,
        heightCm: numOrNull(v.heightCm),
        weightKg: numOrNull(v.weightKg),
        allergies: strOrNull(v.allergies),
        conditions: strOrNull(v.conditions),
        medications: strOrNull(v.medications),
        emergencyContactName: strOrNull(v.emergencyContactName),
        emergencyContactPhone: strOrNull(v.emergencyContactPhone),
        notes: strOrNull(v.notes),
      },
      {
        // Re-seed the form from the canonical saved profile (trimmed/coerced values).
        onSuccess: (saved) => {
          reset(profileToForm(saved));
          toast.success('Medical profile saved');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  });

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Medical profile</h2>
        {initial?.bmi != null && (
          <span className="text-sm text-slate-500">BMI: <span className="font-medium">{initial.bmi}</span></span>
        )}
      </div>
      <form onSubmit={onSave} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-32">
            <Select label="Blood group" {...register('bloodGroup')}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
            </Select>
          </div>
          <div className="w-28"><TextField label="Height (cm)" type="number" {...register('heightCm')} /></div>
          <div className="w-28"><TextField label="Weight (kg)" type="number" {...register('weightKg')} /></div>
        </div>
        <TextField label="Allergies" {...register('allergies')} />
        <TextField label="Chronic conditions" {...register('conditions')} />
        <TextField label="Regular medications" {...register('medications')} />
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[12rem]"><TextField label="Emergency contact" {...register('emergencyContactName')} /></div>
          <div className="flex-1 min-w-[12rem]"><TextField label="Emergency phone" {...register('emergencyContactPhone')} /></div>
        </div>
        <TextField label="Notes" {...register('notes')} />
        <Button type="submit" isLoading={upsert.isPending}>Save profile</Button>
      </form>
    </Card>
  );
}

// ---- Infirmary visits ----

const visitSchema = z.object({
  reason: z.string().trim().min(1, 'Required').max(500),
  treatment: z.string().trim().max(1000).optional(),
  temperatureC: z.string().optional(),
  outcome: z.enum(['RESOLVED', 'SENT_HOME', 'REFERRED', 'MONITORING']),
});
type VisitValues = z.infer<typeof visitSchema>;

function InfirmaryVisits({ studentId }: { studentId: string }) {
  const [page, setPage] = useState(1);
  const visits = useInfirmaryVisits({ studentId, page, limit: 10 }, !!studentId);
  const create = useCreateVisit();
  const remove = useDeleteVisit();
  const meta = visits.data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: { outcome: 'RESOLVED' },
  });

  const onAdd = handleSubmit((v) => {
    create.mutate(
      {
        studentId,
        reason: v.reason,
        treatment: v.treatment?.trim() || undefined,
        temperatureC: v.temperatureC?.trim() ? Number(v.temperatureC) : undefined,
        outcome: v.outcome,
      },
      {
        onSuccess: () => {
          toast.success('Visit logged');
          reset({ reason: '', treatment: '', temperatureC: '', outcome: 'RESOLVED' });
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  });

  const doDelete = (id: string): void => {
    if (!window.confirm('Delete this visit record?')) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Visit deleted'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <Card className="space-y-4">
      <h2 className="font-semibold">Infirmary visits</h2>

      <form onSubmit={onAdd} noValidate className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[14rem]"><TextField label="Reason" {...register('reason')} error={errors.reason?.message} /></div>
        <div className="flex-1 min-w-[12rem]"><TextField label="Treatment" {...register('treatment')} /></div>
        <div className="w-28"><TextField label="Temp (°C)" type="number" step="0.1" {...register('temperatureC')} /></div>
        <div className="w-40">
          <Select label="Outcome" {...register('outcome')}>
            {VISIT_OUTCOMES.map((o) => (<option key={o} value={o}>{o}</option>))}
          </Select>
        </div>
        <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Log visit</Button></div>
      </form>

      {visits.isLoading ? (
        <Spinner />
      ) : visits.data && visits.data.items.length === 0 ? (
        <EmptyState title="No visits" description="Logged infirmary visits will appear here." />
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2">When</th>
              <th className="px-2 py-2">Reason</th>
              <th className="px-2 py-2">Temp</th>
              <th className="px-2 py-2">Outcome</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {visits.data?.items.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-2 py-2 text-slate-500">{v.visitedOn.slice(0, 10)}</td>
                <td className="px-2 py-2 text-slate-700">
                  {v.reason}
                  {v.treatment && <p className="text-xs text-slate-400">{v.treatment}</p>}
                </td>
                <td className="px-2 py-2 tabular-nums">{v.temperatureC != null ? `${v.temperatureC}°` : '—'}</td>
                <td className="px-2 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${outcomeBadge[v.outcome]}`}>
                    {v.outcome}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => doDelete(v.id)}
                    disabled={remove.isPending && remove.variables === v.id}
                    className="text-xs text-red-600 disabled:opacity-50"
                  >
                    remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---- Page ----

export function MedicalPage() {
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const students = useStudents({ limit: 20, search: search || undefined });
  const profile = useMedicalProfile(studentId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medical &amp; Health</h1>
        <p className="text-slate-500">Student medical profiles and infirmary visit log.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <TextField
            label="Find student"
            placeholder="Search by name or admission no."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setStudentId('');
            }}
          />
        </div>
        <div className="w-72">
          <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select</option>
            {students.data?.items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.admissionNo})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {!studentId ? (
        <p className="text-sm text-slate-500">Select a student to view their medical records.</p>
      ) : profile.isLoading ? (
        <Spinner />
      ) : profile.isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(profile.error)}</p>
      ) : (
        <>
          <ProfileEditor key={studentId} studentId={studentId} initial={profile.data ?? null} />
          <InfirmaryVisits studentId={studentId} />
        </>
      )}
    </div>
  );
}
