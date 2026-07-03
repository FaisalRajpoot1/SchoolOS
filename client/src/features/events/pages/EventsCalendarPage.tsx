import { useCalendar } from '../useEvents';
import { EventItem } from '../components/EventItem';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function EventsCalendarPage() {
  const calendar = useCalendar();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-slate-500">Upcoming school events for you.</p>
      </div>

      <Card className="p-0">
        {calendar.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : calendar.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(calendar.error)}</p>
        ) : calendar.data && calendar.data.length > 0 ? (
          <ul className="divide-y divide-slate-100 px-6">
            {calendar.data.map((e) => (
              <li key={e.id}>
                <EventItem event={e} showRsvp />
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No upcoming events.</p>
        )}
      </Card>
    </div>
  );
}
