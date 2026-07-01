import type { EventType, SchoolEvent } from '../events.types';
import { formatEventWhen } from '../format';

const typeBadge: Record<EventType, string> = {
  GENERAL: 'bg-slate-100 text-slate-600',
  HOLIDAY: 'bg-red-50 text-red-700',
  EXAM: 'bg-purple-50 text-purple-700',
  PTM: 'bg-blue-50 text-blue-700',
  COMPETITION: 'bg-amber-50 text-amber-700',
  SPORTS: 'bg-green-50 text-green-700',
};

export function EventItem({ event }: { event: SchoolEvent }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium">{event.title}</p>
        <p className="text-xs text-slate-500">
          {formatEventWhen(event)}
          {event.location ? ` · ${event.location}` : ''}
          {event.audience !== 'ALL' ? ` · ${event.audience}` : ''}
        </p>
        {event.description && <p className="mt-1 text-sm text-slate-600">{event.description}</p>}
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[event.type]}`}>
        {event.type}
      </span>
    </div>
  );
}
