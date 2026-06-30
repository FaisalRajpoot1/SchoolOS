import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '@/features/auth/useAccount';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => reset.mutate({ token, password: values.password }));

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold">Reset password</h1>

        {!token ? (
          <p className="text-center text-sm text-red-600">Missing or invalid reset link.</p>
        ) : reset.isSuccess ? (
          <div className="space-y-3 text-center text-sm">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-green-700">
              Password updated. Please sign in.
            </p>
            <Link to="/login" className="text-brand-600">Go to sign in</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <TextField label="New password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
            <TextField label="Confirm password" type="password" autoComplete="new-password" {...register('confirm')} error={errors.confirm?.message} />
            {reset.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {getApiErrorMessage(reset.error)}
              </p>
            )}
            <Button type="submit" className="w-full" isLoading={reset.isPending}>
              Update password
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
