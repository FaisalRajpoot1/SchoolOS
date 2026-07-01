import type { Announcement, AnnouncementAudience } from '../announcements.types';

const audienceBadge: Record<AnnouncementAudience, string> = {
  ALL: 'bg-slate-100 text-slate-600',
  TEACHERS: 'bg-blue-50 text-blue-700',
  STUDENTS: 'bg-green-50 text-green-700',
  PARENTS: 'bg-purple-50 text-purple-700',
  STAFF: 'bg-amber-50 text-amber-700',
};

export function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const a = announcement;
  return (
    <div className="space-y-1 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">
          {a.pinned && <span className="mr-1 text-brand-600">📌</span>}
          {a.title}
        </p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${audienceBadge[a.audience]}`}>
          {a.audience}
        </span>
      </div>
      <p className="whitespace-pre-line text-sm text-slate-600">{a.body}</p>
      <p className="text-xs text-slate-400">
        {a.author ? `${a.author.firstName} ${a.author.lastName} · ` : ''}
        {a.publishedAt.slice(0, 10)}
      </p>
    </div>
  );
}
