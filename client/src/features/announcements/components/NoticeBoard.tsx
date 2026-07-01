import { Link } from 'react-router-dom';
import { useAnnouncementsFeed } from '../useAnnouncements';
import { AnnouncementItem } from './AnnouncementItem';
import { Card } from '@/components/ui/Card';

/** Compact notice board for the dashboard — hidden when there's nothing to show. */
export function NoticeBoard() {
  const feed = useAnnouncementsFeed();
  if (feed.isLoading || !feed.data || feed.data.length === 0) return null;

  return (
    <Card className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Notice board</h2>
        <Link to="/announcements" className="text-sm text-brand-600">View all</Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {feed.data.slice(0, 3).map((a) => (
          <li key={a.id}>
            <AnnouncementItem announcement={a} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
