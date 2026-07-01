import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

const LINKS = [
  { to: '/settings/school', title: 'School profile', desc: 'Name, branding, timezone, currency, day window.' },
  { to: '/settings/api-keys', title: 'API keys', desc: 'Generate keys for third-party integrations.' },
  { to: '/settings/security', title: 'Security', desc: 'Change password and manage active sessions.' },
  { to: '/audit-logs', title: 'Audit logs', desc: 'Review security-relevant activity.' },
];

const ROLES: { role: string; can: string }[] = [
  { role: 'SUPER_ADMIN', can: 'Owns the platform: create/manage schools, subscriptions, analytics.' },
  { role: 'SCHOOL_ADMIN', can: 'Full control of one school: everything below plus settings.' },
  { role: 'TEACHER', can: 'Attendance, homework, assignments, exam marks, timetable (read).' },
  { role: 'ACCOUNTANT', can: 'Fees: categories, invoices, payments.' },
  { role: 'LIBRARIAN', can: 'Library: books, categories, issue/return.' },
  { role: 'RECEPTIONIST', can: 'Certificates issuance.' },
  { role: 'HR', can: 'Employees, leave, payroll.' },
  { role: 'PARENT', can: 'Portal: own children’s attendance, fees, homework, results.' },
  { role: 'STUDENT', can: 'Reserved for the student portal (future).' },
];

export function SettingsHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500">Configuration and access for your school.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="h-full transition hover:border-brand-300">
              <p className="font-semibold text-brand-700">{l.title}</p>
              <p className="text-sm text-slate-500">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="space-y-3">
        <div>
          <h2 className="font-semibold">Roles &amp; permissions</h2>
          <p className="text-sm text-slate-500">Access is role-based. Reference of what each role can do:</p>
        </div>
        <ul className="divide-y divide-slate-100 text-sm">
          {ROLES.map((r) => (
            <li key={r.role} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
              <span className="w-40 shrink-0 font-mono text-xs text-slate-600">{r.role}</span>
              <span className="text-slate-600">{r.can}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
