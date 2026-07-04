import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '@/features/auth/useAuth';
import type { UserRole } from '@/features/auth/auth.types';
import { useUnreadCount } from '@/features/notifications/useNotifications';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const NOTIFY_ROLES: UserRole[] = [
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'ACCOUNTANT',
  'LIBRARIAN',
  'RECEPTIONIST',
  'HR',
];

interface NavItem {
  to: string;
  label: string;
  /** Roles allowed to see this item; omit for everyone. */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/notifications', label: 'Notifications', roles: NOTIFY_ROLES },
  { to: '/student', label: 'My School', roles: ['STUDENT'] },
  { to: '/schools', label: 'Schools', roles: ['SUPER_ADMIN'] },
  { to: '/students', label: 'Students', roles: ['SCHOOL_ADMIN'] },
  { to: '/admissions', label: 'Admissions', roles: ['SCHOOL_ADMIN'] },
  { to: '/teachers', label: 'Teachers', roles: ['SCHOOL_ADMIN'] },
  { to: '/parents', label: 'Parents', roles: ['SCHOOL_ADMIN'] },
  { to: '/academics/classes', label: 'Classes', roles: ['SCHOOL_ADMIN'] },
  { to: '/academics/subjects', label: 'Subjects', roles: ['SCHOOL_ADMIN'] },
  { to: '/timetable', label: 'Timetable', roles: ['SCHOOL_ADMIN'] },
  { to: '/attendance', label: 'Attendance', roles: ['SCHOOL_ADMIN'] },
  { to: '/behavior', label: 'Behaviour', roles: ['SCHOOL_ADMIN'] },
  { to: '/medical', label: 'Medical', roles: ['SCHOOL_ADMIN'] },
  { to: '/exams', label: 'Exams', roles: ['SCHOOL_ADMIN'] },
  { to: '/exams/grade-scheme', label: 'Grade Scheme', roles: ['SCHOOL_ADMIN'] },
  { to: '/homework', label: 'Homework', roles: ['SCHOOL_ADMIN'] },
  { to: '/assignments', label: 'Assignments', roles: ['SCHOOL_ADMIN'] },
  { to: '/fees/invoices', label: 'Fees', roles: ['SCHOOL_ADMIN'] },
  { to: '/fees/categories', label: 'Fee Categories', roles: ['SCHOOL_ADMIN'] },
  { to: '/library', label: 'Library', roles: ['SCHOOL_ADMIN', 'LIBRARIAN'] },
  { to: '/library/categories', label: 'Book Categories', roles: ['SCHOOL_ADMIN', 'LIBRARIAN'] },
  { to: '/transport/routes', label: 'Transport', roles: ['SCHOOL_ADMIN'] },
  { to: '/hostels', label: 'Hostel', roles: ['SCHOOL_ADMIN'] },
  { to: '/inventory/items', label: 'Inventory', roles: ['SCHOOL_ADMIN'] },
  { to: '/hr/employees', label: 'HR', roles: ['SCHOOL_ADMIN', 'HR'] },
  { to: '/payroll/payslips', label: 'Payroll', roles: ['SCHOOL_ADMIN', 'HR'] },
  { to: '/payroll/tax-slabs', label: 'Tax Slabs', roles: ['SCHOOL_ADMIN', 'HR'] },
  { to: '/certificates', label: 'Certificates', roles: ['SCHOOL_ADMIN', 'RECEPTIONIST'] },
  { to: '/documents', label: 'Documents', roles: ['SCHOOL_ADMIN'] },
  { to: '/reports', label: 'Reports', roles: ['SCHOOL_ADMIN'] },
  { to: '/ai', label: 'AI Assistant', roles: ['SCHOOL_ADMIN'] },
  { to: '/settings/school', label: 'School Settings', roles: ['SCHOOL_ADMIN'] },
  { to: '/settings', label: 'Settings', roles: ['SCHOOL_ADMIN'] },
  { to: '/announcements', label: 'Announcements' },
  { to: '/announcements/manage', label: 'Manage Notices', roles: ['SCHOOL_ADMIN'] },
  { to: '/events', label: 'Events' },
  { to: '/events/manage', label: 'Manage Events', roles: ['SCHOOL_ADMIN'] },
  { to: '/audit-logs', label: 'Audit Logs', roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { to: '/settings/security', label: 'Security' },
];

export function AppLayout() {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const canNotify = !!user && !!user.schoolId && NOTIFY_ROLES.includes(user.role);
  const unread = useUnreadCount(canNotify);
  const unreadCount = unread.data ?? 0;

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
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
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
