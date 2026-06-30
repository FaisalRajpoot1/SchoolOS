import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import type { UserRole } from '@/features/auth/auth.types';

interface ProtectedRouteProps {
  /** When set, only these roles may access the route. */
  roles?: UserRole[];
  children?: ReactNode;
}

/**
 * Guards routes requiring authentication (and optionally specific roles).
 * Usable as a wrapper (`children`) or as a layout route (renders `<Outlet />`).
 * Waits out the initial silent refresh to avoid a flash redirect.
 */
export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
