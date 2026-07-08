import { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAttendanceReport, useFinanceReport, useStudentsReport } from '../useReports';
import { formatAmount } from '@/features/fees/format';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const doughnutOpts = { plugins: { legend: { position: 'right' as const } }, cutout: '60%' };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function ReportsPage() {
  const students = useStudentsReport();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const attendance = useAttendanceReport(from || undefined, to || undefined);
  const [finFrom, setFinFrom] = useState('');
  const [finTo, setFinTo] = useState('');
  const finance = useFinanceReport(finFrom || undefined, finTo || undefined);
  const finHasRange = Boolean(finFrom || finTo);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-slate-500">Snapshots across students, attendance, and finance.</p>
      </div>

      {/* Students */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Students</h2>
          {students.data && (
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  'students-by-class.csv',
                  ['Class', 'Students'],
                  students.data.byClass.map((c) => [c.className, c.count]),
                )
              }
            >
              Export CSV
            </Button>
          )}
        </div>
        {students.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : students.isError || !students.data ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(students.error)}</p>
        ) : (
          <>
            <div className="flex gap-8">
              <Stat label="Total" value={students.data.total} />
              <Stat label="Active" value={students.data.active} />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="h-56">
                <Bar
                  data={{
                    labels: students.data.byClass.map((c) => c.className),
                    datasets: [{ label: 'Students', data: students.data.byClass.map((c) => c.count), backgroundColor: '#2563eb' }],
                  }}
                  options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
                />
              </div>
              <div className="h-56">
                <Doughnut
                  data={{
                    labels: Object.keys(students.data.byStatus),
                    datasets: [{ data: Object.values(students.data.byStatus), backgroundColor: ['#16a34a', '#94a3b8', '#2563eb', '#f59e0b', '#a855f7'], borderWidth: 0 }],
                  }}
                  options={doughnutOpts}
                />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Attendance */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Attendance</h2>
          <div className="flex items-end gap-2">
            <div>
              <label className="text-xs text-slate-500">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>
        </div>
        {attendance.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : attendance.isError || !attendance.data ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(attendance.error)}</p>
        ) : attendance.data.marked === 0 ? (
          <p className="text-sm text-slate-500">No attendance recorded for {attendance.data.from} → {attendance.data.to}.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-8">
            <div className="h-48 w-48">
              <Doughnut
                data={{
                  labels: ['Present', 'Absent', 'Late', 'Leave'],
                  datasets: [{ data: [attendance.data.PRESENT, attendance.data.ABSENT, attendance.data.LATE, attendance.data.LEAVE], backgroundColor: ['#16a34a', '#dc2626', '#f59e0b', '#2563eb'], borderWidth: 0 }],
                }}
                options={doughnutOpts}
              />
            </div>
            <div>
              <p className="text-4xl font-bold">{attendance.data.rate}%</p>
              <p className="text-sm text-slate-500">present rate</p>
              <p className="mt-2 text-xs text-slate-400">{attendance.data.marked} records · {attendance.data.from} → {attendance.data.to}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Finance */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Finance</h2>
          <div className="flex items-end gap-2">
            <div>
              <label className="text-xs text-slate-500">From</label>
              <input type="date" value={finFrom} onChange={(e) => setFinFrom(e.target.value)} className="block rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500">To</label>
              <input type="date" value={finTo} onChange={(e) => setFinTo(e.target.value)} className="block rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500" />
            </div>
            {finance.data && finance.data.topDefaulters.length > 0 && (
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCsv(
                    'fee-defaulters.csv',
                    ['Student', 'Admission No', 'Balance'],
                    finance.data.topDefaulters.map((d) => [d.name, d.admissionNo, d.balance]),
                  )
                }
              >
                Export defaulters
              </Button>
            )}
          </div>
        </div>
        {finance.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : finance.isError || !finance.data ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(finance.error)}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-8">
              <Stat
                label={finHasRange ? 'Invoiced (period)' : 'Invoiced'}
                value={formatAmount(finance.data.invoiced)}
              />
              <Stat
                label={finHasRange ? 'Collected (period)' : 'Collected'}
                value={formatAmount(finance.data.collected)}
              />
              <Stat label="Outstanding (current)" value={formatAmount(finance.data.outstanding)} />
            </div>
            {finHasRange && (
              <p className="text-xs text-slate-400">
                Invoiced &amp; collected cover {finance.data.from ?? '…'} → {finance.data.to ?? '…'};
                outstanding &amp; top-outstanding are current across all invoices.
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="h-48">
                <Doughnut
                  data={{
                    labels: Object.keys(finance.data.byStatus),
                    datasets: [{ data: Object.values(finance.data.byStatus), backgroundColor: ['#f59e0b', '#2563eb', '#16a34a', '#94a3b8'], borderWidth: 0 }],
                  }}
                  options={doughnutOpts}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Top outstanding</p>
                {finance.data.topDefaulters.length > 0 ? (
                  <ul className="text-sm">
                    {finance.data.topDefaulters.map((d) => (
                      <li key={d.admissionNo} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                        <span>{d.name} <span className="font-mono text-xs text-slate-400">{d.admissionNo}</span></span>
                        <span className="tabular-nums font-medium">{formatAmount(d.balance)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No outstanding balances.</p>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
