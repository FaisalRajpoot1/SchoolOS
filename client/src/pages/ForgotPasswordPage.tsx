import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/features/auth/useAccount';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

const schema = z.object({
  schoolId: z.string().uuid('Enter a valid school ID'),
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => forgot.mutate(values));
  const resetToken = forgot.data?.resetToken;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold">Forgot password</h1>
          <p className="text-sm text-slate-500">We'll send a reset link if the account exists.</p>
        </div>

        {forgot.isSuccess ? (
          <div className="space-y-3 text-sm">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-green-700">
              If an account exists, a reset link has been sent.
            </p>
            {resetToken && (
              <p className="break-all rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                Dev token:{' '}
                <Link to={`/reset-password?token=${resetToken}`} className="text-brand-600 underline">
                  reset now
                </Link>
              </p>
            )}
            <Link to="/login" className="block text-center text-brand-600">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <TextField label="School ID" {...register('schoolId')} error={errors.schoolId?.message} />
            <TextField label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Button type="submit" className="w-full" isLoading={forgot.isPending}>
              Send reset link
            </Button>
            <Link to="/login" className="block text-center text-sm text-brand-600">Back to sign in</Link>
          </form>
        )}
      </div>
    </main>
  );
}
