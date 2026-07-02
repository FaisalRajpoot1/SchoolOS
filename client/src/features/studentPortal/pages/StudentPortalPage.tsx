import {
  useStudentAssignments,
  useStudentAttendance,
  useStudentHomework,
  useStudentInvoices,
  useStudentMe,
  useStudentResults,
} from '../useStudentPortal';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatAmount } from '@/features/fees/format';

const badge: Record<string, string> = {
  PRESENT: 'bg-green-50 text-green-700',
  ABSENT: 'bg-red-50 text-red-700',
  LATE: 'bg-amber-50 text-amber-700',
  LEAVE: 'bg-blue-50 text-blue-700',
};

export function StudentPortalPage() {
  const me = useStudentMe();
  const attendance = useStudentAttendance();
  const invoices = useStudentInvoices();
  const homework = useStudentHomework();
  const assignments = useStudentAssignments();
  const results = useStudentResults();

  const s = me.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{s ? `${s.firstName} ${s.lastName}` : 'My School'}</h1>
        {s && (
          <p className="text-slate-500">
            {s.class?.name ?? '—'}
            {s.section ? ` / ${s.section.name}` : ''} · {s.admissionNo}
          </p>
        )}
      </div>

      {/* Attendance */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Attendance</h2>
        {attendance.isLoading ? (
          <Spinner />
        ) : attendance.data ? (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((st) => (
                <span key={st} className={`rounded-full px-2 py-1 font-medium ${badge[st]}`}>
                  {st}: {attendance.data.counts[st]}
                </span>
              ))}
            </div>
            {attendance.data.records.length > 0 ? (
              <ul className="text-sm text-slate-600">
                {attendance.data.records.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                    <span>{r.date.slice(0, 10)}</span>
                    <span className="font-medium">{r.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No attendance records yet.</p>
            )}
          </>
        ) : null}
      </Card>

      {/* Fees */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Fees</h2>
        {invoices.isLoading ? (
          <Spinner />
        ) : invoices.data && invoices.data.length > 0 ? (
          <ul className="text-sm">
            {invoices.data.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span>
                  <span className="font-medium">{inv.invoiceNo}</span>
                  <span className="ml-2 text-slate-500">{inv.title}</span>
                </span>
                <span className="text-right tabular-nums">
                  Balance {formatAmount(inv.totals.balance)}
                  <span className="ml-2 text-xs text-slate-400">{inv.status}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No invoices" />
        )}
      </Card>

      {/* Homework */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Homework</h2>
        {homework.isLoading ? (
          <Spinner />
        ) : homework.data && homework.data.length > 0 ? (
          <ul className="text-sm">
            {homework.data.map((h) => (
              <li key={h.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span>
                  <span className="font-medium">{h.title}</span>
                  {h.subject && <span className="ml-2 text-xs text-slate-400">{h.subject.name}</span>}
                  <span className="ml-2 text-xs text-slate-400">due {h.dueDate.slice(0, 10)}</span>
                </span>
                {h.submission ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {h.submission.marks != null ? `${h.submission.marks} marks` : 'Submitted'}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Pending</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No homework" />
        )}
      </Card>

      {/* Assignments */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Assignments</h2>
        {assignments.isLoading ? (
          <Spinner />
        ) : assignments.data && assignments.data.length > 0 ? (
          <ul className="text-sm">
            {assignments.data.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span>
                  <span className="font-medium">{a.title}</span>
                  {a.subject && <span className="ml-2 text-xs text-slate-400">{a.subject.name}</span>}
                  <span className="ml-2 text-xs text-slate-400">due {a.dueDate.slice(0, 10)}</span>
                </span>
                {a.submission ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {a.submission.marks != null ? `${a.submission.marks}/${a.maxMarks}` : 'Submitted'}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Pending</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No assignments" />
        )}
      </Card>

      {/* Results */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Exam results</h2>
        {results.isLoading ? (
          <Spinner />
        ) : results.data && results.data.length > 0 ? (
          <ul className="text-sm">
            {results.data.map((r) => (
              <li key={r.examId} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <span className="font-medium">{r.examName}</span>
                <span className="text-right tabular-nums">
                  {r.obtained}/{r.totalMax} · {r.percentage}% · grade {r.grade}
                  <span className={`ml-2 text-xs font-medium ${r.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {r.passed ? 'PASS' : 'FAIL'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No published results yet" />
        )}
      </Card>
    </div>
  );
}
