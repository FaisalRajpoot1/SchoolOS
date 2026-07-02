export interface IcsEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** UTC date-only stamp, e.g. 20260702. */
export const icsDate = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

/** UTC date-time stamp, e.g. 20260702T140000Z. */
export const icsDateTime = (d: Date): string =>
  `${icsDate(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/** Escapes a text value per RFC 5545 (backslash, comma, semicolon, newline). */
const escapeText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * 86_400_000);

/**
 * Folds a content line to <=75 octets per RFC 5545 §3.1, breaking only on
 * UTF-8 character boundaries. Continuation lines begin with a single space.
 */
const foldLine = (line: string): string => {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let start = 0;
  // First line gets 75 octets; continuation lines 74 (a leading space counts).
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Do not split inside a multi-byte sequence: back up off continuation bytes.
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end -= 1;
    chunks.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = 74;
  }
  return chunks.join('\r\n ');
};

/** Builds a single-event iCalendar (VCALENDAR) string. `dtstamp` is the generation time. */
export const buildEventIcs = (event: IcsEvent, dtstamp: string): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SchoolOS//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@schoolos`,
    `DTSTAMP:${dtstamp}`,
  ];

  if (event.allDay) {
    // All-day DTEND is exclusive (day after the last day).
    const endExclusive = addDays(event.endDate ?? event.startDate, 1);
    lines.push(`DTSTART;VALUE=DATE:${icsDate(event.startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(endExclusive)}`);
  } else {
    const end = event.endDate ?? new Date(event.startDate.getTime() + 3_600_000);
    lines.push(`DTSTART:${icsDateTime(event.startDate)}`);
    lines.push(`DTEND:${icsDateTime(end)}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n');
};
