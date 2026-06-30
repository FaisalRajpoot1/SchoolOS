import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useChangePassword,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from '../useAccount';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

export function SecurityPage() {
  const changePassword = useChangePassword();
  const sessions = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await changePassword.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    reset();
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-slate-500">Manage your password and active sessions.</p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField label="Current password" type="password" autoComplete="current-password" {...register('currentPassword')} error={errors.currentPassword?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="New password" type="password" autoComplete="new-password" {...register('newPassword')} error={errors.newPassword?.message} />
            <TextField label="Confirm" type="password" autoComplete="new-password" {...register('confirm')} error={errors.confirm?.message} />
          </div>
          {changePassword.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {getApiErrorMessage(changePassword.error)}
            </p>
          )}
          {changePassword.isSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Password changed. Other sessions were signed out.
            </p>
          )}
          <Button type="submit" isLoading={changePassword.isPending}>Change password</Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Active sessions</h2>
          <Button variant="secondary" onClick={() => revokeOthers.mutate()} isLoading={revokeOthers.isPending}>
            Sign out other sessions
          </Button>
        </div>
        {sessions.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : sessions.data && sessions.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {sessions.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {s.userAgent ?? 'Unknown device'}
                    {s.isCurrent && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        This session
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.ipAddress ?? 'unknown IP'} · last used {(s.lastUsedAt ?? s.createdAt).slice(0, 10)}
                  </p>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    isLoading={revokeSession.isPending && revokeSession.variables === s.id}
                    onClick={() => revokeSession.mutate(s.id)}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No active sessions.</p>
        )}
      </Card>
    </div>
  );
}
