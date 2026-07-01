import { Link } from 'react-router-dom';
import { useCalendar } from '../useEvents';
import { EventItem } from './EventItem';
import { Card } from '@/components/ui/Card';

/** Compact upcoming-events list for the dashboard — hidden when empty. */
export function UpcomingEvents() {
  const calendar = useCalendar();
  if (calendar.isLoading || !calendar.data || calendar.data.length === 0) return null;

  return (
    <Card className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Upcoming events</h2>
        <Link to="/events" className="text-sm text-brand-600">View all</Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {calendar.data.slice(0, 4).map((e) => (
          <li key={e.id}>
            <EventItem event={e} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
