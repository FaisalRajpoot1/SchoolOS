import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '@/features/auth/useAuth';
import type { UserRole } from '@/features/auth/auth.types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  /** Roles allowed to see this item; omit for everyone. */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/schools', label: 'Schools', roles: ['SUPER_ADMIN'] },
  { to: '/students', label: 'Students', roles: ['SCHOOL_ADMIN'] },
  { to: '/academics/classes', label: 'Classes', roles: ['SCHOOL_ADMIN'] },
  { to: '/academics/subjects', label: 'Subjects', roles: ['SCHOOL_ADMIN'] },
  { to: '/settings/school', label: 'School Settings', roles: ['SCHOOL_ADMIN'] },
];

export function AppLayout() {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const handleLogout = async (): Promise<void> => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5 text-xl font-bold">
          School<span className="text-brand-600">OS</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">
            {user?.firstName} {user?.lastName}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {user?.role}
            </span>
          </div>
          <Button variant="secondary" onClick={handleLogout} isLoading={logout.isPending}>
            Sign out
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
