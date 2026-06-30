import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { useLogin } from '../useAuth';

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  const onSubmit = handleSubmit(async (values) => {
    await login.mutateAsync(values);
    onSuccess?.();
  });

  const serverMessage =
    login.error instanceof AxiosError
      ? ((login.error.response?.data as { message?: string })?.message ?? 'Login failed')
      : login.error
        ? 'Login failed'
        : null;

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
    </form>
  );
}
