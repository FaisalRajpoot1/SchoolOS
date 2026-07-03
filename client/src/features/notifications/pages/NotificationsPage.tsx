import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '../useNotifications';
import type { AppNotification, NotificationType } from '../notifications.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const typeBadge: Record<NotificationType, string> = {
  GENERAL: 'bg-slate-100 text-slate-600',
  ANNOUNCEMENT: 'bg-blue-50 text-blue-700',
  EVENT: 'bg-purple-50 text-purple-700',
  BEHAVIOR: 'bg-amber-50 text-amber-700',
  ATTENDANCE: 'bg-green-50 text-green-700',
  FEE: 'bg-red-50 text-red-700',
};

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const query = useNotifications({ page, limit: 15, unread: unreadOnly || undefined });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const remove = useDeleteNotification();
  const navigate = useNavigate();
  const meta = query.data?.meta;

  const open = (n: AppNotification): void => {
    if (!n.readAt) markRead.mutate(n.id);
    // Only follow internal, absolute app paths (never an external/arbitrary URL).
    if (n.link && n.link.startsWith('/')) navigate(n.link);
  };

  const doMarkAll = (): void => {
    markAllRead.mutate(undefined, {
      onSuccess: (count) => toast.success(count > 0 ? `Marked ${count} as read` : 'Nothing unread'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-slate-500">Your in-app inbox.</p>
        </div>
        <Button variant="secondary" onClick={doMarkAll} isLoading={markAllRead.isPending}>
          Mark all read
        </Button>
      </div>

      <div className="flex gap-2 text-sm">
        <button
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={`rounded-full px-3 py-1 ${!unreadOnly ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          All
        </button>
        <button
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={`rounded-full px-3 py-1 ${unreadOnly ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Unread
        </button>
      </div>

      <Card className="p-0">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(query.error)}</p>
        ) : query.data && query.data.items.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {query.data?.items.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-5 py-3 ${n.readAt ? '' : 'bg-blue-50/40'}`}
              >
                {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="unread" />}
                <button
                  onClick={() => open(n)}
                  className={`min-w-0 flex-1 text-left ${n.readAt ? 'pl-5' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[n.type]}`}>
                      {n.type}
                    </span>
                    <span className="truncate font-medium">{n.title}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">{n.createdAt.slice(0, 16).replace('T', ' ')}</p>
                </button>
                <button
                  onClick={() => remove.mutate(n.id)}
                  disabled={remove.isPending && remove.variables === n.id}
                  className="text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
