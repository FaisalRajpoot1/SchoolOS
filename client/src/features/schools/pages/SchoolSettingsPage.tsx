import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMySchool, useUpdateMySchool } from '../useSchools';
import type { School, UpdateSchoolPayload } from '../schools.types';
import { AcademicYearsPanel } from '@/features/academicYears/components/AcademicYearsPanel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  websiteUrl: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  locale: string;
  themeColor: string;
  dayStart: string; // HH:MM
  dayEnd: string; // HH:MM
}

const minutesToTime = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const schoolToForm = (s: School): ProfileForm => ({
  name: s.name,
  email: s.email ?? '',
  phone: s.phone ?? '',
  websiteUrl: s.websiteUrl ?? '',
  address: s.address ?? '',
  city: s.city ?? '',
  country: s.country ?? '',
  timezone: s.timezone,
  currency: s.currency,
  locale: s.locale,
  themeColor: s.themeColor,
  dayStart: minutesToTime(s.dayStartMinute),
  dayEnd: minutesToTime(s.dayEndMinute),
});

/** Maps empty strings to `undefined` so optional fields are omitted. */
const blankToUndefined = (value: string): string | undefined => (value.trim() === '' ? undefined : value);

export function SchoolSettingsPage() {
  const school = useMySchool();
  const update = useUpdateMySchool();
  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    if (school.data) reset(schoolToForm(school.data));
  }, [school.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateSchoolPayload = {
      name: values.name,
      email: blankToUndefined(values.email),
      phone: blankToUndefined(values.phone),
      websiteUrl: blankToUndefined(values.websiteUrl),
      address: blankToUndefined(values.address),
      city: blankToUndefined(values.city),
      country: blankToUndefined(values.country),
      timezone: values.timezone,
      currency: values.currency.toUpperCase(),
      locale: values.locale,
      themeColor: values.themeColor,
      dayStartMinute: timeToMinutes(values.dayStart),
      dayEndMinute: timeToMinutes(values.dayEnd),
    };
    await update.mutateAsync(payload);
  });

  if (school.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (school.isError) return <p className="text-sm text-red-600">{getApiErrorMessage(school.error)}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School settings</h1>
        <p className="text-slate-500">Manage your school profile, branding, and sessions.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold">Profile</h2>
          <TextField label="School name" {...register('name')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Email" type="email" {...register('email')} />
            <TextField label="Phone" {...register('phone')} />
          </div>
          <TextField label="Website" {...register('websiteUrl')} />
          <TextField label="Address" {...register('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="City" {...register('city')} />
            <TextField label="Country" {...register('country')} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Localization & branding</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Timezone" {...register('timezone')} />
            <TextField label="Currency (ISO)" maxLength={3} {...register('currency')} />
            <TextField label="Locale" {...register('locale')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Day starts" type="time" {...register('dayStart')} />
            <TextField label="Day ends" type="time" {...register('dayEnd')} />
            <TextField label="Theme color" type="color" className="h-10 p-1" {...register('themeColor')} />
          </div>
        </Card>

        {update.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(update.error)}
          </p>
        )}
        {update.isSuccess && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>

      <AcademicYearsPanel />
    </div>
  );
}
