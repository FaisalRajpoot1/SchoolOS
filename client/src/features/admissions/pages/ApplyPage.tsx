import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { admissionsApi } from '../admissions.api';
import type { ApplyPayload } from '../admissions.types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

interface Form {
  applicantFirstName: string;
  applicantLastName: string;
  gender: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  desiredClass: string;
  message: string;
}
const EMPTY: Form = {
  applicantFirstName: '',
  applicantLastName: '',
  gender: '',
  dateOfBirth: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  desiredClass: '',
  message: '',
};

export function ApplyPage() {
  const { schoolId = '' } = useParams();
  const school = useQuery({
    queryKey: ['admissions', 'school', schoolId],
    queryFn: () => admissionsApi.publicSchool(schoolId),
    retry: false,
  });

  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof Form, v: string): void => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: ApplyPayload = {
        schoolId,
        applicantFirstName: form.applicantFirstName.trim(),
        applicantLastName: form.applicantLastName.trim(),
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim(),
      };
      if (form.gender) payload.gender = form.gender;
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.guardianEmail.trim()) payload.guardianEmail = form.guardianEmail.trim();
      if (form.desiredClass.trim()) payload.desiredClass = form.desiredClass.trim();
      if (form.message.trim()) payload.message = form.message.trim();

      await admissionsApi.apply(payload);
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <span className="text-xl font-bold">
            School<span className="text-brand-600">OS</span>
          </span>
          <p className="text-sm text-slate-500">Admission enquiry</p>
        </div>

        {school.isError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            This application link is invalid.
          </p>
        ) : done ? (
          <div className="rounded-lg bg-green-50 px-4 py-6 text-center text-sm text-green-700">
            ✓ Thank you! Your enquiry for <span className="font-medium">{school.data?.name}</span> has
            been submitted. The school will be in touch.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-center text-sm text-slate-600">
              Applying to <span className="font-medium">{school.data?.name ?? '…'}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Applicant first name" value={form.applicantFirstName} onChange={(e) => set('applicantFirstName', e.target.value)} required />
              <TextField label="Applicant last name" value={form.applicantLastName} onChange={(e) => set('applicantLastName', e.target.value)} required />
              <Select label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
              <TextField label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              <TextField label="Guardian name" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} required />
              <TextField label="Guardian phone" value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} required />
              <TextField label="Guardian email" type="email" value={form.guardianEmail} onChange={(e) => set('guardianEmail', e.target.value)} />
              <TextField label="Desired class" placeholder="e.g. Grade 1" value={form.desiredClass} onChange={(e) => set('desiredClass', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Message (optional)</label>
              <textarea
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" isLoading={submitting} disabled={school.isError}>
              Submit enquiry
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
