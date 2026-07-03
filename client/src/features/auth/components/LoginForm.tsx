import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { useLogin } from '../useAuth';
import type { LoginPayload } from '../auth.types';

const loginFormSchema = z.object({
  schoolId: z.string().uuid('Enter a valid school ID'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const fieldClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const login = useLogin();
  const [pending, setPending] = useState<LoginFormValues | null>(null);
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  const finish = (payload: LoginPayload, result: Awaited<ReturnType<typeof login.mutateAsync>>): void => {
    if ('twoFactorRequired' in result) {
      setPending(payload); // move to the 2FA step
      return;
    }
    onSuccess?.();
  };

  const onSubmit = handleSubmit(async (values) => {
    const result = await login.mutateAsync(values);
    finish(values, result);
  });

  const onSubmitCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!pending) return;
    const payload: LoginPayload = useBackup
      ? { ...pending, backupCode: code.trim() }
      : { ...pending, totpCode: code.trim() };
    const result = await login.mutateAsync(payload);
    finish(payload, result);
  };

  const serverMessage =
    login.error instanceof AxiosError
      ? ((login.error.response?.data as { message?: string })?.message ?? 'Login failed')
      : login.error
        ? 'Login failed'
        : null;

  // ---- Second-factor step ----
  if (pending) {
    return (
      <form onSubmit={onSubmitCode} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="code" className="text-sm font-medium text-slate-700">
            {useBackup ? 'Backup code' : 'Authentication code'}
          </label>
          <input
            id="code"
            autoFocus
            autoComplete="one-time-code"
            inputMode={useBackup ? 'text' : 'numeric'}
            placeholder={useBackup ? 'XXXX-XXXX' : '123456'}
            className={fieldClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            {useBackup
              ? 'Enter one of your saved backup codes.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>

        {serverMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverMessage}</p>
        )}

        <button
          type="submit"
          disabled={login.isPending || code.trim().length === 0}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {login.isPending ? 'Verifying…' : 'Verify'}
        </button>

        <button
          type="button"
          onClick={() => { setUseBackup((b) => !b); setCode(''); }}
          className="w-full text-center text-sm text-brand-600"
        >
          {useBackup ? 'Use authenticator app instead' : 'Use a backup code'}
        </button>
      </form>
    );
  }

  // ---- Credentials step ----
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="schoolId" className="text-sm font-medium text-slate-700">
          School ID
        </label>
        <input id="schoolId" className={fieldClass} {...register('schoolId')} />
        {errors.schoolId && <p className="text-xs text-red-600">{errors.schoolId.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input id="email" type="email" autoComplete="email" className={fieldClass} {...register('email')} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={fieldClass}
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {serverMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverMessage}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || login.isPending}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm">
        <Link to="/forgot-password" className="text-brand-600">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
