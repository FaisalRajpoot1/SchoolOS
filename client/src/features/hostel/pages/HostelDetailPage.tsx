import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useAddRoom,
  useDeleteHostel,
  useDeleteRoom,
  useHostel,
  useRemoveHostelAllocation,
  useSetHostelAllocation,
} from '../useHostel';
import type { HostelRoom } from '../hostel.types';
import { useStudents } from '@/features/students/useStudents';
import { formatAmount } from '@/features/fees/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

function RoomCard({
  hostelId,
  room,
  students,
  allocatedIds,
}: {
  hostelId: string;
  room: HostelRoom;
  students: StudentOption[];
  allocatedIds: Set<string>;
}) {
  const setAllocation = useSetHostelAllocation(hostelId);
  const removeAllocation = useRemoveHostelAllocation(hostelId);
  const deleteRoom = useDeleteRoom(hostelId);
  const [studentId, setStudentId] = useState('');
  const [bedLabel, setBedLabel] = useState('');

  const isFull = room.allocations.length >= room.capacity;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">
            Room {room.roomNumber}
            {room.floor && <span className="ml-2 text-xs text-slate-400">Floor {room.floor}</span>}
          </p>
          <p className="text-xs text-slate-500">{room.allocations.length}/{room.capacity} beds</p>
        </div>
        <Button variant="ghost" isLoading={deleteRoom.isPending} onClick={() => deleteRoom.mutate(room.id)}>
          Delete room
        </Button>
      </div>

      {room.allocations.length > 0 && (
        <ul className="divide-y divide-slate-100 text-sm">
          {room.allocations.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-1.5">
              <span>
                {a.student.firstName} {a.student.lastName}
                <span className="ml-2 font-mono text-xs text-slate-400">{a.student.admissionNo}</span>
                {a.bedLabel && <span className="ml-2 text-xs text-slate-500">bed {a.bedLabel}</span>}
              </span>
              <Button variant="ghost" isLoading={removeAllocation.isPending && removeAllocation.variables === a.student.id} onClick={() => removeAllocation.mutate(a.student.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isFull ? (
        <p className="text-xs text-amber-700">Room is full.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
          <div className="flex-1 min-w-40">
            <Select aria-label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Allocate student…</option>
              {students
                .filter((s) => !allocatedIds.has(s.id))
                .map((s) => (<option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>))}
            </Select>
          </div>
          <input
            value={bedLabel}
            onChange={(e) => setBedLabel(e.target.value)}
            placeholder="Bed"
            className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500"
          />
          <Button
            disabled={!studentId}
            isLoading={setAllocation.isPending}
            onClick={() => {
              setAllocation.mutate({ studentId, payload: { roomId: room.id, bedLabel: bedLabel || undefined } });
              setStudentId('');
              setBedLabel('');
            }}
          >
            Allocate
          </Button>
        </div>
      )}
    </Card>
  );
}

export function HostelDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const hostel = useHostel(id);
  const students = useStudents({ limit: 100, status: 'ACTIVE' });
  const addRoom = useAddRoom(id);
  const deleteHostel = useDeleteHostel();

  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('2');

  if (hostel.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (hostel.isError || !hostel.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(hostel.error)}</p>;

  const h = hostel.data;
  const allocatedIds = new Set(h.rooms.flatMap((r) => r.allocations.map((a) => a.student.id)));

  const handleDelete = async (): Promise<void> => {
    await deleteHostel.mutateAsync(id);
    navigate('/hostels', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/hostels" className="text-sm text-brand-600">← Back to hostels</Link>
          <h1 className="mt-2 text-2xl font-bold">{h.name} <span className="text-base font-normal text-slate-400">{h.type}</span></h1>
          <p className="text-slate-500">
            {h.wardenName ? `Warden: ${h.wardenName}` : 'No warden'} · monthly fee {formatAmount(h.monthlyFee)}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteHostel.isPending}>Delete</Button>
      </div>

      {h.rooms.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {h.rooms.map((room) => (
            <RoomCard key={room.id} hostelId={id} room={room} students={students.data?.items ?? []} allocatedIds={allocatedIds} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No rooms yet.</p>
      )}

      <Card className="space-y-3">
        <h2 className="font-semibold">Add room</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <label className="text-sm font-medium text-slate-700">Room no</label>
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="w-24">
            <label className="text-sm font-medium text-slate-700">Floor</label>
            <input value={floor} onChange={(e) => setFloor(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="w-24">
            <label className="text-sm font-medium text-slate-700">Capacity</label>
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <Button
            disabled={!roomNumber.trim()}
            isLoading={addRoom.isPending}
            onClick={() => {
              addRoom.mutate({ roomNumber: roomNumber.trim(), floor: floor.trim() || undefined, capacity: Number(capacity) || 1 });
              setRoomNumber('');
              setFloor('');
              setCapacity('2');
            }}
          >
            Add room
          </Button>
        </div>
        {addRoom.isError && <p className="text-sm text-red-600">{getApiErrorMessage(addRoom.error)}</p>}
      </Card>
    </div>
  );
}
