import type { SchoolEvent } from './events.types';

/** Formats an event's date range for display. */
export const formatEventWhen = (event: SchoolEvent): string => {
  const start = event.startDate.slice(0, 10);
  const time = event.allDay ? '' : ` ${event.startDate.slice(11, 16)}`;
  const end =
    event.endDate && event.endDate.slice(0, 10) !== start ? ` → ${event.endDate.slice(0, 10)}` : '';
  return `${start}${time}${end}`;
};
