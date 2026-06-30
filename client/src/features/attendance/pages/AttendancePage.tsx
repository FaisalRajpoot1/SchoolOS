import { useEffect, useMemo, useState } from 'react';
import { useClass, useClasses } from '@/features/academics/useAcademics';
import { useBulkMarkAttendance, useRoster } from '../useAttendance';
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../attendance.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { getApiErrorMessage } from '@/lib/apiError';

const today = new Date().toISOString().slice(0, 10);

const activeClasses: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-600 text-white',
  ABSENT: 'bg-red-600 text-white',
  LATE: 'bg-amber-500 text-white',
  LEAVE: 'bg-blue-600 text-white',
};

interface Mark {
  status: AttendanceStatus;
  remark: string;
}

export function AttendancePage() {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState<Record<string, Mark>>({});

  const classes = useClasses();
  const classDetail = useClass(classId);
  const sections = classId ? (classDetail.data?.sections ?? []) : [];

  const roster = useRoster(sectionId, date);
  const save = useBulkMarkAttendance(sectionId, date);

  // Seed local marks whenever a roster loads (default unmarked students to PRESENT).
  useEffect(() => {
    if (roster.data) {
      const next: Record<string, Mark> = {};
      for (const entry of roster.data) {
        next[entry.student.id] = {
          status: entry.status ?? 'PRESENT',
          remark: entry.remark ?? '',
        };
      }
      setMarks(next);
    }
  }, [roster.data]);

  const counts = useMemo(() => {
    const tally: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    for (const mark of Object.values(marks)) tally[mark.status] += 1;
    return tally;
  }, [marks]);

  const setStatus = (studentId: string, status: AttendanceStatus): void =>
    setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status, remark: prev[studentId]?.remark ?? '' } }));

  const setRemark = (studentId: string, remark: string): void =>
    setMarks((prev) => ({ ...prev, [studentId]: { status: prev[studentId]?.status ?? 'PRESENT', remark } }));

  const markAllPresent = (): void =>
    setMarks((prev) => {
      const next: Record<string, Mark> = {};
      for (const [id, mark] of Object.entries(prev)) next[id] = { ...mark, status: 'PRESENT' };
      return next;
    });

  const handleSave = (): void => {
    if (!roster.data) return;
    save.mutate({
      sectionId,
      date,
      records: roster.data.map((entry) => ({
        studentId: entry.student.id,
        status: marks[entry.student.id]?.status ?? 'PRESENT',
        remark: marks[entry.student.id]?.remark || null,
      })),
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-slate-500">Take daily attendance for a class section.</p>
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            label="Section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
          >
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <label className="text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </Card>

      {!sectionId ? (
        <p className="text-sm text-slate-500">Select a class and section to begin.</p>
      ) : roster.isLoading ? (
        <p className="text-sm text-slate-500">Loading roster…</p>
      ) : roster.isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(roster.error)}</p>
      ) : roster.data && roster.data.length === 0 ? (
        <p className="text-sm text-slate-500">No active students enrolled in this section.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 text-xs">
              {ATTENDANCE_STATUSES.map((s) => (
                <span key={s} className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                  {s}: {counts[s]}
                </span>
              ))}
            </div>
            <Button variant="secondary" onClick={markAllPresent}>
              Mark all present
            </Button>
          </div>

          <Card className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {roster.data?.map((entry) => {
                  const mark = marks[entry.student.id];
                  return (
                    <tr key={entry.student.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-3">
                        <p className="font-medium">
                          {entry.student.firstName} {entry.student.lastName}
                        </p>
                        <p className="font-mono text-xs text-slate-500">{entry.student.admissionNo}</p>
                      </td>
                      <td className="px-6 py-3">
                        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                          {ATTENDANCE_STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(entry.student.id, s)}
                              className={cn(
                                'px-3 py-1.5 text-xs font-medium transition',
                                mark?.status === s ? activeClasses[s] : 'bg-white text-slate-600 hover:bg-slate-50',
                              )}
                            >
                              {s[0]}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          value={mark?.remark ?? ''}
                          onChange={(e) => setRemark(entry.student.id, e.target.value)}
                          placeholder="Optional"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {save.isSuccess && <span className="text-sm text-green-700">Attendance saved.</span>}
            {save.isError && <span className="text-sm text-red-600">{getApiErrorMessage(save.error)}</span>}
            <Button onClick={handleSave} isLoading={save.isPending}>
              Save attendance
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
