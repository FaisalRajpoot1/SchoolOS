import { describe, expect, it } from 'vitest';
import { buildEventIcs, icsDate, icsDateTime, type IcsEvent } from './event.ics';

const DTSTAMP = '20260101T000000Z';

const base: IcsEvent = {
  id: 'evt-1',
  title: 'Sports Day',
  description: null,
  location: null,
  startDate: new Date(Date.UTC(2026, 6, 2, 9, 30, 0)),
  endDate: null,
  allDay: false,
};

describe('icsDate / icsDateTime', () => {
  it('formats UTC date and date-time', () => {
    expect(icsDate(new Date(Date.UTC(2026, 6, 2)))).toBe('20260702');
    expect(icsDateTime(new Date(Date.UTC(2026, 6, 2, 14, 5, 6)))).toBe('20260702T140506Z');
  });
});

describe('buildEventIcs', () => {
  it('produces a valid VCALENDAR/VEVENT with CRLF and UID/DTSTAMP', () => {
    const ics = buildEventIcs(base, DTSTAMP);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:evt-1@schoolos');
    expect(ics).toContain(`DTSTAMP:${DTSTAMP}`);
    expect(ics).toContain('SUMMARY:Sports Day');
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('uses timed DTSTART/DTEND (default +1h) for non-all-day events', () => {
    const ics = buildEventIcs(base, DTSTAMP);
    expect(ics).toContain('DTSTART:20260702T093000Z');
    expect(ics).toContain('DTEND:20260702T103000Z');
  });

  it('uses VALUE=DATE with exclusive end for all-day events', () => {
    const ics = buildEventIcs(
      { ...base, allDay: true, startDate: new Date(Date.UTC(2026, 6, 2)) },
      DTSTAMP,
    );
    expect(ics).toContain('DTSTART;VALUE=DATE:20260702');
    expect(ics).toContain('DTEND;VALUE=DATE:20260703');
  });

  it('folds content lines longer than 75 octets (RFC 5545 §3.1)', () => {
    const long = 'x'.repeat(200);
    const ics = buildEventIcs({ ...base, description: long }, DTSTAMP);
    for (const line of ics.split('\r\n')) {
      // Continuation lines begin with a space; every physical line stays <=75 octets.
      expect(Buffer.from(line, 'utf8').length).toBeLessThanOrEqual(75);
    }
    // Unfolding (strip CRLF + leading space) restores the original DESCRIPTION.
    expect(ics.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${long}`);
  });

  it('escapes special characters and includes optional fields', () => {
    const ics = buildEventIcs(
      { ...base, location: 'Hall A, Block B', description: 'Line1\nLine2; ok' },
      DTSTAMP,
    );
    expect(ics).toContain('LOCATION:Hall A\\, Block B');
    expect(ics).toContain('DESCRIPTION:Line1\\nLine2\\; ok');
  });
});
