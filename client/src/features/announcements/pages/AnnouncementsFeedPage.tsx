import { useAnnouncementsFeed } from '../useAnnouncements';
import { AnnouncementItem } from '../components/AnnouncementItem';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function AnnouncementsFeedPage() {
  const feed = useAnnouncementsFeed();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notice board</h1>
        <p className="text-slate-500">Announcements for you.</p>
      </div>

      <Card className="p-0">
        {feed.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : feed.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(feed.error)}</p>
        ) : feed.data && feed.data.length > 0 ? (
          <ul className="divide-y divide-slate-100 px-6">
            {feed.data.map((a) => (
              <li key={a.id}>
                <AnnouncementItem announcement={a} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No announcements right now.</p>
        )}
      </Card>
    </div>
  );
}
