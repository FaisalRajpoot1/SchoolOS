import { describe, expect, it } from 'vitest';
import { groupTimetable, hhmm, type TimetableSlotView } from './timetable.pdf';

const slot = (over: Partial<TimetableSlotView>): TimetableSlotView => ({
  dayOfWeek: 'MON',
  startMinute: 480,
  endMinute: 540,
  subject: 'Math',
  teacher: 'Jane Doe',
  section: 'Grade 5 A',
  room: '101',
  ...over,
});

describe('hhmm', () => {
  it('formats minutes-from-midnight as zero-padded HH:MM', () => {
    expect(hhmm(0)).toBe('00:00');
    expect(hhmm(480)).toBe('08:00');
    expect(hhmm(545)).toBe('09:05');
    expect(hhmm(1439)).toBe('23:59');
  });
});

describe('groupTimetable', () => {
  it('orders days Mon→Sun and omits days with no slots', () => {
    const grouped = groupTimetable([
      slot({ dayOfWeek: 'WED' }),
      slot({ dayOfWeek: 'MON' }),
      slot({ dayOfWeek: 'FRI' }),
    ]);
    expect(grouped.map((d) => d.day)).toEqual(['MON', 'WED', 'FRI']);
    expect(grouped[0]?.label).toBe('Monday');
  });

  it('sorts each day by start time then end time', () => {
    const grouped = groupTimetable([
      slot({ startMinute: 540, endMinute: 600 }),
      slot({ startMinute: 480, endMinute: 540 }),
      slot({ startMinute: 480, endMinute: 500 }),
    ]);
    const mon = grouped[0]?.slots ?? [];
    expect(mon.map((s) => [s.startMinute, s.endMinute])).toEqual([
      [480, 500],
      [480, 540],
      [540, 600],
    ]);
  });

  it('returns an empty array when there are no slots', () => {
    expect(groupTimetable([])).toEqual([]);
  });
});
