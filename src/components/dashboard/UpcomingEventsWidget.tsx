import { useEffect, useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUpcomingEventsWithRSVPs, type EventWithRSVPs } from '@/services/analytics.service';
import type { EventType } from '@/types/database.types';

interface UpcomingEventsWidgetProps {
  teamId: string;
  limit?: number;
}

export const UpcomingEventsWidget = memo(function UpcomingEventsWidget({ teamId, limit = 5 }: UpcomingEventsWidgetProps) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventWithRSVPs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // All hooks must be called before any conditional returns
  const getEventTypeBadgeVariant = useCallback((type: EventType): 'default' | 'secondary' | 'outline' | 'success' | 'info' => {
    switch (type) {
      case 'practice':
        return 'info';
      case 'game':
        return 'success';
      default:
        return 'outline';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUpcomingEventsWithRSVPs(teamId, limit);
      setEvents(data);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.widgets.upcomingEvents')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.messages.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient-teal border-l-4 border-l-club-secondary hover-glow">
      <CardHeader>
        <CardTitle className="text-club-secondary flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('dashboard.widgets.upcomingEvents')}
        </CardTitle>
        <CardDescription className="font-medium">
          {events.length === 0
            ? t('event.noEvents')
            : t('dashboard.widgets.nextEvents', { count: events.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('event.noEventsDescription')}
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-club-secondary/20 bg-club-secondary/5 hover:bg-club-secondary/10 hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-club-secondary/10">
                  <Calendar className="h-4 w-4 text-club-secondary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{event.title}</p>
                    <Badge variant={getEventTypeBadgeVariant(event.type)}>
                      {t(`event.types.${event.type}` as any)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{formatDate(event.start_time)}</p>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      {event.rsvpCounts.attending} {t('rsvp.status.attending')}
                      {event.rsvpCounts.pending > 0 &&
                        `, ${event.rsvpCounts.pending} ${t('rsvp.status.pending')}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
