import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pin } from 'lucide-react';
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
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.announcements.noAnnouncements')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAnnouncements.map((announcement) => (
        <Card
          key={announcement.id}
          className={announcement.pinned ? 'bg-primary/5 border-primary/20' : ''}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg flex-1">{announcement.title}</CardTitle>
              {announcement.pinned && (
                <Pin className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3 whitespace-pre-wrap">{announcement.content}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{announcement.author.full_name}</span>
              <span>
                {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
