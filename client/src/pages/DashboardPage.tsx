import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '@/features/auth/useAuth';
import { useDashboard, useTeacherDashboard } from '@/features/dashboard/useDashboard';
import { usePortalMe } from '@/features/portal/usePortal';
import { minutesToTime } from '@/features/timetable/time';
import { NoticeBoard } from '@/features/announcements/components/NoticeBoard';
import { UpcomingEvents } from '@/features/events/components/UpcomingEvents';
import { Card } from '@/components/ui/Card';
import { formatAmount } from '@/features/fees/format';
import { getApiErrorMessage } from '@/lib/apiError';

ChartJS.register(ArcElement, Tooltip, Legend);

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

function SchoolAdminDashboard() {
  const { data, isLoading, isError, error } = useDashboard(true);

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (isError || !data) return <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>;

  const att = data.attendanceToday;
  const fin = data.finance;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Students" value={data.students.active} sub={`${data.students.total} total`} />
        <Kpi label="Teachers" value={data.teachers.active} sub={`${data.teachers.total} total`} />
        <Kpi label="Classes" value={data.classes} sub={`${data.sections} sections`} />
        <Kpi
          label="Outstanding fees"
          value={formatAmount(fin.outstanding)}
          sub={`${formatAmount(fin.collected)} collected`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Today's attendance</h2>
            <span className="text-sm text-slate-500">{att.date}</span>
          </div>
          {att.marked === 0 ? (
            <p className="text-sm text-slate-500">
              No attendance marked yet.{' '}
              <Link to="/attendance" className="text-brand-600">
                Take attendance
              </Link>
              .
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-40 w-40">
                <Doughnut
                  data={{
                    labels: ['Present', 'Absent', 'Late', 'Leave'],
                    datasets: [
                      {
                        data: [att.present, att.absent, att.late, att.leave],
                        backgroundColor: ['#16a34a', '#dc2626', '#f59e0b', '#2563eb'],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{ plugins: { legend: { position: 'right' } }, cutout: '62%' }}
                />
              </div>
              <div>
                <p className="text-3xl font-bold">{att.rate}%</p>
                <p className="text-sm text-slate-500">present</p>
                <p className="mt-2 text-xs text-slate-400">
                  {att.marked} of {att.activeStudents} marked
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Invoices by status</h2>
          <div className="flex items-center gap-6">
            <div className="h-40 w-40">
              <Doughnut
                data={{
                  labels: ['Pending', 'Partial', 'Paid', 'Cancelled'],
                  datasets: [
                    {
                      data: [
                        fin.byStatus.PENDING,
                        fin.byStatus.PARTIAL,
                        fin.byStatus.PAID,
                        fin.byStatus.CANCELLED,
                      ],
                      backgroundColor: ['#f59e0b', '#2563eb', '#16a34a', '#94a3b8'],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{ plugins: { legend: { position: 'right' } }, cutout: '62%' }}
              />
            </div>
            <div className="text-sm">
              <p className="text-slate-500">Invoiced</p>
              <p className="text-xl font-semibold tabular-nums">{formatAmount(fin.invoiced)}</p>
              <p className="mt-2 text-slate-500">Collected</p>
              <p className="text-xl font-semibold tabular-nums text-green-700">
                {formatAmount(fin.collected)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent invoices</h2>
          <Link to="/fees/invoices" className="text-sm text-brand-600">
            View all
          </Link>
        </div>
        {data.recentInvoices.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {data.recentInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <Link to={`/fees/invoices/${inv.id}`} className="font-medium text-brand-700">
                  {inv.invoiceNo}
                  <span className="ml-2 font-normal text-slate-500">
                    {inv.student.firstName} {inv.student.lastName}
                  </span>
                </Link>
                <span className="tabular-nums text-slate-600">{formatAmount(inv.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No invoices yet.</p>
        )}
      </Card>
    </div>
  );
}

function TeacherDashboard() {
  const { data, isLoading, isError, error } = useTeacherDashboard(true);

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (isError || !data) return <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="My sections" value={data.sections} sub="as class teacher" />
        <Kpi label="Awaiting grading" value={data.pendingGrading} sub="homework & assignments" />
        <Kpi label="Upcoming homework" value={data.upcomingHomework} sub="due today or later" />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Today's schedule</h2>
          <Link to="/timetable" className="text-sm text-brand-600">
            Full timetable
          </Link>
        </div>
        {data.today.periods.length === 0 ? (
          <p className="text-sm text-slate-500">No periods scheduled for today.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.today.periods.map((p, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium tabular-nums">
                    {minutesToTime(p.startMinute)}–{minutesToTime(p.endMinute)}
                  </span>
                  <span className="ml-3 text-slate-700">{p.subject ?? 'Subject TBD'}</span>
                </div>
                <span className="text-slate-500">
                  {p.section ?? '—'}
                  {p.room ? ` · Room ${p.room}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function ParentDashboard() {
  const me = usePortalMe();

  if (me.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (me.isError || !me.data) return <p className="text-sm text-red-600">{getApiErrorMessage(me.error)}</p>;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">My children</h2>
      {me.data.children.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {me.data.children.map((child) => (
            <Link key={child.id} to={`/portal/children/${child.id}`}>
              <Card className="transition hover:border-brand-300">
                <p className="text-lg font-semibold text-brand-700">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-sm text-slate-500">
                  {child.class?.name ?? '—'}
                  {child.section ? ` / ${child.section.name}` : ''} · {child.admissionNo}
                </p>
                <p className="mt-2 text-sm text-brand-600">View attendance, fees, homework & results →</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No children are linked to your account yet.</p>
      )}
    </div>
  );
}

function StudentDashboard() {
  return (
    <Card>
      <p className="text-sm text-slate-500">Student portal</p>
      <Link to="/student" className="text-lg font-semibold text-brand-600">
        View my attendance, fees, homework &amp; results →
      </Link>
    </Card>
  );
}

function SuperAdminDashboard() {
  return (
    <Card>
      <p className="text-sm text-slate-500">Platform</p>
      <Link to="/schools" className="text-lg font-semibold text-brand-600">
        Manage schools →
      </Link>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-slate-500">Here's an overview of your workspace.</p>
      </div>

      <NoticeBoard />
      <UpcomingEvents />

      {user?.role === 'SUPER_ADMIN' ? (
        <SuperAdminDashboard />
      ) : user?.role === 'SCHOOL_ADMIN' ? (
        <SchoolAdminDashboard />
      ) : user?.role === 'TEACHER' ? (
        <TeacherDashboard />
      ) : user?.role === 'PARENT' ? (
        <ParentDashboard />
      ) : user?.role === 'STUDENT' ? (
        <StudentDashboard />
      ) : (
        <Card>
          <p className="text-sm text-slate-500">Your role</p>
          <p className="text-lg font-semibold">{user?.role}</p>
        </Card>
      )}
    </div>
  );
}
