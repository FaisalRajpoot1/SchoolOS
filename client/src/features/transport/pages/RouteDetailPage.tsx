import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useAddStop,
  useDeleteRoute,
  useDeleteStop,
  useRemoveAllocation,
  useRoute,
  useSetAllocation,
} from '../useTransport';
import { useStudents } from '@/features/students/useStudents';
import { minutesToTime, timeToMinutes } from '@/features/timetable/time';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

export function RouteDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const route = useRoute(id);
  const students = useStudents({ limit: 100, status: 'ACTIVE' });
  const addStop = useAddStop(id);
  const deleteStop = useDeleteStop(id);
  const setAllocation = useSetAllocation(id);
  const removeAllocation = useRemoveAllocation(id);
  const deleteRoute = useDeleteRoute();

  const [stopName, setStopName] = useState('');
  const [stopTime, setStopTime] = useState('');
  const [studentId, setStudentId] = useState('');
  const [allocStopId, setAllocStopId] = useState('');

  if (route.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (route.isError || !route.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(route.error)}</p>;

  const r = route.data;
  const allocatedIds = new Set(r.allocations.map((a) => a.student.id));

  const handleDelete = async (): Promise<void> => {
    await deleteRoute.mutateAsync(id);
    navigate('/transport/routes', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/transport/routes" className="text-sm text-brand-600">← Back to routes</Link>
          <h1 className="mt-2 text-2xl font-bold">{r.name}</h1>
          <p className="text-slate-500">
            {r.vehicle ? `${r.vehicle.registrationNo}${r.vehicle.model ? ` · ${r.vehicle.model}` : ''}` : 'No vehicle'} ·
            monthly fee {formatAmount(r.fee)}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteRoute.isPending}>Delete</Button>
      </div>

      {/* Stops */}
      <Card className="space-y-4">
        <h2 className="font-semibold">Stops</h2>
        {r.stops.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {r.stops.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="text-slate-400">#{s.sequence}</span>{' '}
                  <span className="font-medium">{s.name}</span>
                  {s.pickupMinute !== null && (
                    <span className="ml-2 text-xs text-slate-500">{minutesToTime(s.pickupMinute)}</span>
                  )}
                </span>
                <Button variant="ghost" isLoading={deleteStop.isPending && deleteStop.variables === s.id} onClick={() => deleteStop.mutate(s.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No stops yet.</p>
        )}
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <div className="flex-1 min-w-40">
            <label className="text-sm font-medium text-slate-700">Stop name</label>
            <input value={stopName} onChange={(e) => setStopName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="w-32">
            <label className="text-sm font-medium text-slate-700">Pickup</label>
            <input type="time" value={stopTime} onChange={(e) => setStopTime(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <Button
            disabled={!stopName.trim()}
            isLoading={addStop.isPending}
            onClick={() => {
              addStop.mutate({
                name: stopName.trim(),
                sequence: r.stops.length + 1,
                pickupMinute: stopTime ? timeToMinutes(stopTime) : undefined,
              });
              setStopName('');
              setStopTime('');
            }}
          >
            Add stop
          </Button>
        </div>
      </Card>

      {/* Allocations */}
      <Card className="space-y-4">
        <h2 className="font-semibold">Allocated students</h2>
        {r.allocations.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {r.allocations.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{a.student.firstName} {a.student.lastName}</span>
                  <span className="ml-2 font-mono text-xs text-slate-400">{a.student.admissionNo}</span>
                  {a.stop && <span className="ml-2 text-xs text-slate-500">@ {a.stop.name}</span>}
                </span>
                <Button variant="ghost" isLoading={removeAllocation.isPending && removeAllocation.variables === a.student.id} onClick={() => removeAllocation.mutate(a.student.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No students allocated.</p>
        )}
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <div className="flex-1 min-w-48">
            <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.data?.items
                .filter((s) => !allocatedIds.has(s.id))
                .map((s) => (<option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>))}
            </Select>
          </div>
          <div className="w-40">
            <Select label="Stop" value={allocStopId} onChange={(e) => setAllocStopId(e.target.value)}>
              <option value="">—</option>
              {r.stops.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </Select>
          </div>
          <Button
            disabled={!studentId}
            isLoading={setAllocation.isPending}
            onClick={() => {
              setAllocation.mutate({ studentId, payload: { routeId: id, stopId: allocStopId || undefined } });
              setStudentId('');
              setAllocStopId('');
            }}
          >
            Allocate
          </Button>
        </div>
        {setAllocation.isError && <p className="text-sm text-red-600">{getApiErrorMessage(setAllocation.error)}</p>}
      </Card>
    </div>
  );
}
