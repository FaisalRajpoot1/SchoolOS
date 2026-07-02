import { renderPdf } from '@/utils/pdf';

export type TimetableScope = 'section' | 'teacher';

export interface TimetableSlotView {
  dayOfWeek: string; // MON..SUN
  startMinute: number;
  endMinute: number;
  subject: string | null;
  teacher: string | null;
  section: string | null;
  room: string | null;
}

export interface TimetablePdfData {
  schoolName: string;
  title: string;
  scope: TimetableScope;
  slots: TimetableSlotView[];
}

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

const DAY_LABEL: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

/** Minutes-from-midnight to a zero-padded HH:MM string. */
export const hhmm = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export interface TimetableDay {
  day: string;
  label: string;
  slots: TimetableSlotView[];
}

/**
 * Groups slots into canonical weekday order, each day's slots sorted by start
 * time (then end time). Days with no slots are omitted. Pure — unit-testable.
 */
export const groupTimetable = (slots: TimetableSlotView[]): TimetableDay[] =>
  DAY_ORDER.map((day) => ({
    day,
    label: DAY_LABEL[day] ?? day,
    slots: slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute),
  })).filter((d) => d.slots.length > 0);

/** Renders a section or teacher weekly timetable as a PDF. */
export const buildTimetablePdf = (data: TimetablePdfData): Promise<Buffer> =>
  renderPdf((doc) => {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    doc.fontSize(18).font('Helvetica-Bold').text(data.schoolName, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Helvetica').text(data.title, { align: 'center' });
    doc.moveDown(1);

    const days = groupTimetable(data.slots);
    if (days.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No timetable slots scheduled.', { align: 'center' });
      return;
    }

    // The second column shows whichever entity is NOT fixed by the scope:
    // a section's timetable lists teachers; a teacher's timetable lists sections.
    const detailHeader = data.scope === 'section' ? 'Teacher' : 'Class';
    const col = { time: 0.24, subject: 0.34, detail: 0.28, room: 0.14 };
    const x = {
      time: 0,
      subject: width * col.time,
      detail: width * (col.time + col.subject),
      room: width * (col.time + col.subject + col.detail),
    };
    const cell = (
      text: string,
      cx: number,
      cy: number,
      w: number,
      align: 'left' | 'right' | 'center' = 'left',
    ): void => {
      doc.text(text, left + cx, cy, { width: w, align });
    };
    const rowHeight = 18;
    const bottom = doc.page.height - doc.page.margins.bottom;

    // Draws a day heading + column header row at the current `doc.y`, returning
    // the y position where the first data row should start. `continued` marks a
    // heading re-drawn at the top of a fresh page after a mid-day break.
    const drawHeader = (label: string, continued: boolean): number => {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text(continued ? `${label} (cont.)` : label);
      doc.fillColor('#000');
      const y = doc.y + 2;
      doc.fontSize(9).font('Helvetica-Bold');
      cell('Time', x.time, y, width * col.time);
      cell('Subject', x.subject, y, width * col.subject);
      cell(detailHeader, x.detail, y, width * col.detail);
      cell('Room', x.room, y, width * col.room);
      doc.moveTo(left, y + rowHeight - 6).lineTo(right, y + rowHeight - 6).stroke();
      return y + rowHeight - 2;
    };

    for (const day of days) {
      // Keep a day's header with at least its first row on the same page.
      if (doc.y + rowHeight * 3 > bottom) doc.addPage();
      doc.moveDown(0.4);
      let y = drawHeader(day.label, false);

      doc.font('Helvetica').fontSize(10);
      for (const slot of day.slots) {
        if (y + rowHeight > bottom) {
          doc.addPage();
          doc.y = doc.page.margins.top;
          y = drawHeader(day.label, true);
          doc.font('Helvetica').fontSize(10);
        }
        const detail = data.scope === 'section' ? slot.teacher : slot.section;
        cell(`${hhmm(slot.startMinute)}–${hhmm(slot.endMinute)}`, x.time, y, width * col.time);
        cell(slot.subject ?? '—', x.subject, y, width * col.subject);
        cell(detail ?? '—', x.detail, y, width * col.detail);
        cell(slot.room ?? '—', x.room, y, width * col.room);
        y += rowHeight;
      }
      doc.y = y;
    }
  });
