import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApplyLeave, useDeleteEmployee, useEmployee, useSetEmployeeStatus } from '../useHr';
import { LEAVE_TYPES, STAFF_STATUSES, type LeaveStatus, type LeaveType, type StaffStatus } from '../hr.types';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

const leaveBadge: Record<LeaveStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
};

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const employee = useEmployee(id);
  const setStatus = useSetEmployeeStatus(id);
  const applyLeave = useApplyLeave(id);
  const deleteEmployee = useDeleteEmployee();

  const [type, setType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  if (employee.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (employee.isError || !employee.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(employee.error)}</p>;

  const e = employee.data;

  const handleDelete = async (): Promise<void> => {
    await deleteEmployee.mutateAsync(id);
    navigate('/hr/employees', { replace: true });
  };

  const submitLeave = (): void => {
    if (!startDate || !endDate) return;
    applyLeave.mutate(
      { type, startDate, endDate, reason: reason || undefined },
      { onSuccess: () => { setStartDate(''); setEndDate(''); setReason(''); } },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/hr/employees" className="text-sm text-brand-600">← Back to employees</Link>
          <h1 className="mt-2 text-2xl font-bold">{e.firstName} {e.lastName}</h1>
          <p className="font-mono text-xs text-slate-500">{e.employeeCode}</p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteEmployee.isPending}>Delete</Button>
      </div>

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Detail label="Designation" value={e.designation} />
        <Detail label="Department" value={e.department} />
        <Detail label="Employment" value={e.employmentType} />
        <Detail label="Email" value={e.email} />
        <Detail label="Phone" value={e.phone} />
        <Detail label="Salary" value={e.salary != null ? formatAmount(e.salary) : null} />
        <Detail label="Joined" value={e.joiningDate.slice(0, 10)} />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Status</h2>
        <div className="w-48">
          <Select value={e.status} onChange={(ev) => setStatus.mutate(ev.target.value as StaffStatus)} disabled={setStatus.isPending}>
            {STAFF_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </Select>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Leave requests</h2>
        {e.leaveRequests.length > 0 ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {e.leaveRequests.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2">
                <span>
                  <span className="font-medium">{l.type}</span>
                  <span className="ml-2 text-slate-500">{l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}</span>
                  {l.reason && <span className="ml-2 text-xs text-slate-400">{l.reason}</span>}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${leaveBadge[l.status]}`}>{l.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No leave requests.</p>
        )}

        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <div className="w-32">
            <Select label="Type" value={type} onChange={(ev) => setType(ev.target.value as LeaveType)}>
              {LEAVE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </Select>
          </div>
          <div className="w-40">
            <label className="text-sm font-medium text-slate-700">From</label>
            <input type="date" value={startDate} onChange={(ev) => setStartDate(ev.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="w-40">
            <label className="text-sm font-medium text-slate-700">To</label>
            <input type="date" value={endDate} onChange={(ev) => setEndDate(ev.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-sm font-medium text-slate-700">Reason</label>
            <input value={reason} onChange={(ev) => setReason(ev.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <Button disabled={!startDate || !endDate} isLoading={applyLeave.isPending} onClick={submitLeave}>Apply leave</Button>
        </div>
        {applyLeave.isError && <p className="text-sm text-red-600">{getApiErrorMessage(applyLeave.error)}</p>}
      </Card>
    </div>
  );
}
