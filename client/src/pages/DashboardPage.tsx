import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { Card } from '@/components/ui/Card';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-slate-500">Here's a quick overview of your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Your role</p>
          <p className="text-lg font-semibold">{user?.role}</p>
        </Card>

        {user?.role === 'SUPER_ADMIN' && (
          <Card>
            <p className="text-sm text-slate-500">Platform</p>
            <Link to="/schools" className="text-lg font-semibold text-brand-600">
              Manage schools →
            </Link>
          </Card>
        )}

        {user?.role === 'SCHOOL_ADMIN' && (
          <Card>
            <p className="text-sm text-slate-500">Your school</p>
            <Link to="/settings/school" className="text-lg font-semibold text-brand-600">
              School settings →
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
