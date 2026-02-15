import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnnouncementWithAuthor } from '@/services/announcements.service';

interface AnnouncementsFeedProps {
  announcements: AnnouncementWithAuthor[];
  showPinnedOnly?: boolean;
}

export function AnnouncementsFeed({ announcements, showPinnedOnly = false }: AnnouncementsFeedProps) {
  const { t } = useTranslation();

  const filteredAnnouncements = showPinnedOnly
    ? announcements.filter(a => a.pinned)
    : announcements;

  if (filteredAnnouncements.length === 0) {
    return (
      <div className="bg-navy-90 border border-white/[0.06] rounded-xl py-12 text-center">
        <p className="text-white/50">
          {t('playerExperience.announcements.noAnnouncements')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={cn(
            'bg-navy-90 border border-white/[0.06] rounded-xl p-4',
            announcement.pinned
              ? 'border-l-[3px] border-l-club-primary bg-gradient-to-r from-club-primary/[0.06] to-navy-90'
              : 'border-l-[3px] border-l-club-secondary'
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-white flex-1">{announcement.title}</h3>
            {announcement.pinned && (
              <Pin className="w-4 h-4 text-club-primary flex-shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-[13px] text-white/60 whitespace-pre-wrap mb-3">{announcement.content}</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50">{announcement.author.full_name}</span>
            <span className="font-mono text-[11px] text-white/50">
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
