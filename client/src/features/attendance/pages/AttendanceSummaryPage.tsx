import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClass, useClasses } from '@/features/academics/useAcademics';
import { useAttendanceSummary } from '../useAttendance';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { downloadCsv } from '@/lib/csv';
import { getApiErrorMessage } from '@/lib/apiError';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 3, CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const now = new Date();

export function AttendanceSummaryPage() {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const classes = useClasses();
  const classDetail = useClass(classId);
  const sections = classId ? (classDetail.data?.sections ?? []) : [];
  const summary = useAttendanceSummary(sectionId, month, year);

  const exportCsv = (): void => {
    if (!summary.data) return;
    downloadCsv(
      `attendance-${summary.data.section.class.name}-${summary.data.section.name}-${year}-${String(month).padStart(2, '0')}.csv`,
      ['Admission No', 'Name', 'Present', 'Absent', 'Late', 'Leave', 'Marked', 'Rate %'],
      summary.data.rows.map((r) => [
        r.student.admissionNo,
        `${r.student.firstName} ${r.student.lastName}`,
        r.present,
        r.absent,
        r.late,
        r.leave,
        r.marked,
        r.rate,
      ]),
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/attendance" className="text-sm text-brand-600">← Back to attendance</Link>
        <h1 className="mt-2 text-2xl font-bold">Monthly attendance summary</h1>
        <p className="text-slate-500">Per-student totals for a section over a month.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId('');
            }}
          >
            <option value="">Select class</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Select>
        </div>
        <div className="w-28">
          <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
        {summary.data && summary.data.rows.length > 0 && (
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
        )}
      </Card>

      <Card className="p-0">
        {!sectionId ? (
          <EmptyState title="Select a class and section" description="Pick a section to see the monthly summary." />
        ) : summary.isLoading ? (
          <Spinner />
        ) : summary.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(summary.error)}</p>
        ) : summary.data && summary.data.rows.length === 0 ? (
          <EmptyState title="No students in this section" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3 text-right">Present</th>
                <th className="px-4 py-3 text-right">Absent</th>
                <th className="px-4 py-3 text-right">Late</th>
                <th className="px-4 py-3 text-right">Leave</th>
                <th className="px-4 py-3 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {summary.data?.rows.map((r) => (
                <tr key={r.student.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{r.student.firstName} {r.student.lastName}</span>
                    <span className="ml-2 font-mono text-xs text-slate-400">{r.student.admissionNo}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-700">{r.present}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">{r.absent}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-600">{r.late}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-blue-600">{r.leave}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {r.marked > 0 ? `${r.rate}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
