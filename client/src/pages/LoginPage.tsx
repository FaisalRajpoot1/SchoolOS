import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <Link to="/" className="text-2xl font-bold">
            School<span className="text-brand-600">OS</span>
          </Link>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      </div>
    </main>
  );
}
