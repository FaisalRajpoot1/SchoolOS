import { Link, useParams } from 'react-router-dom';
import {
  useChildAttendance,
  useChildHomework,
  useChildInvoices,
  useChildResults,
  usePortalMe,
} from '../usePortal';
import { Card } from '@/components/ui/Card';
import { formatAmount } from '@/features/fees/format';

const badge: Record<string, string> = {
  PRESENT: 'bg-green-50 text-green-700',
  ABSENT: 'bg-red-50 text-red-700',
  LATE: 'bg-amber-50 text-amber-700',
  LEAVE: 'bg-blue-50 text-blue-700',
};

export function ChildPage() {
  const { studentId = '' } = useParams();
  const me = usePortalMe();
  const attendance = useChildAttendance(studentId);
  const invoices = useChildInvoices(studentId);
  const homework = useChildHomework(studentId);
  const results = useChildResults(studentId);

  const child = me.data?.children.find((c) => c.id === studentId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/dashboard" className="text-sm text-brand-600">← Back to my children</Link>
        <h1 className="mt-2 text-2xl font-bold">
          {child ? `${child.firstName} ${child.lastName}` : 'Student'}
        </h1>
        {child && (
          <p className="text-slate-500">
            {child.class?.name ?? '—'}
            {child.section ? ` / ${child.section.name}` : ''} · {child.admissionNo}
          </p>
        )}
      </div>

      {/* Attendance */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Attendance</h2>
        {attendance.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : attendance.data ? (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map((s) => (
                <span key={s} className={`rounded-full px-2 py-1 font-medium ${badge[s]}`}>
                  {s}: {attendance.data.counts[s]}
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
          <p className="text-sm text-slate-500">Loading…</p>
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
          <p className="text-sm text-slate-500">No invoices.</p>
        )}
      </Card>

      {/* Homework */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Homework</h2>
        {homework.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
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
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Pending
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No homework.</p>
        )}
      </Card>

      {/* Results */}
      <Card className="space-y-3">
        <h2 className="font-semibold">Exam results</h2>
        {results.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
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
          <p className="text-sm text-slate-500">No published results yet.</p>
        )}
      </Card>
    </div>
  );
}
