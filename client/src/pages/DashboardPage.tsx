import { useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '@/features/auth/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-60"
        >
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Role</p>
        <p className="text-lg font-semibold">{user?.role}</p>
      </section>
    </main>
  );
}
