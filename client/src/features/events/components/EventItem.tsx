import { eventsApi } from '../events.api';
import type { EventType, RsvpStatus, SchoolEvent } from '../events.types';
import { formatEventWhen } from '../format';
import { useEventRsvp, useSetRsvp } from '../useEvents';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const typeBadge: Record<EventType, string> = {
  GENERAL: 'bg-slate-100 text-slate-600',
  HOLIDAY: 'bg-red-50 text-red-700',
  EXAM: 'bg-purple-50 text-purple-700',
  PTM: 'bg-blue-50 text-blue-700',
  COMPETITION: 'bg-amber-50 text-amber-700',
  SPORTS: 'bg-green-50 text-green-700',
};

const rsvpOptions: { status: RsvpStatus; label: string; active: string }[] = [
  { status: 'GOING', label: 'Going', active: 'bg-green-600 text-white border-green-600' },
  { status: 'MAYBE', label: 'Maybe', active: 'bg-amber-500 text-white border-amber-500' },
  { status: 'NOT_GOING', label: "Can't go", active: 'bg-slate-600 text-white border-slate-600' },
];

function RsvpControls({ eventId }: { eventId: string }) {
  const rsvp = useEventRsvp(eventId);
  const setRsvp = useSetRsvp(eventId);

  const choose = (status: RsvpStatus): void => {
    // Clicking the active choice again withdraws the RSVP.
    const next = rsvp.data?.myStatus === status ? null : status;
    setRsvp.mutate(next, {
      onError: (error) => toast.error(getApiErrorMessage(error, 'Could not save your RSVP')),
    });
  };

  const counts = rsvp.data?.counts;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {rsvpOptions.map((opt) => {
        const isActive = rsvp.data?.myStatus === opt.status;
        return (
          <button
            key={opt.status}
            type="button"
            disabled={setRsvp.isPending || rsvp.isLoading}
            onClick={() => choose(opt.status)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
              isActive ? opt.active : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
      {counts && counts.going > 0 && (
        <span className="ml-1 text-xs text-slate-400">{counts.going} going</span>
      )}
    </div>
  );
}

export function EventItem({ event, showRsvp = false }: { event: SchoolEvent; showRsvp?: boolean }) {
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
        <button
          type="button"
          onClick={() => {
            void eventsApi.downloadIcs(event.id).catch((error: unknown) => {
              toast.error(getApiErrorMessage(error, 'Could not download calendar file'));
            });
          }}
          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Add to calendar
        </button>
        {showRsvp && <RsvpControls eventId={event.id} />}
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[event.type]}`}>
        {event.type}
      </span>
    </div>
  );
}
