import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Event } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface PlayerScheduleViewProps {
  events: Event[];
  rsvpStatus?: Record<string, string>;
  onRSVP?: (eventId: string) => void;
}

/**
 * Player schedule view component
 * Displays upcoming events for players with RSVP information
 */
export function PlayerScheduleView({ events, rsvpStatus = {}, onRSVP }: PlayerScheduleViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'practice':
        return 'bg-vq-teal/15 text-vq-teal';
      case 'game':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'tournament':
        return 'bg-purple-500/15 text-purple-400';
      case 'meeting':
        return 'bg-club-secondary/15 text-club-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'not_attending':
        return 'bg-club-primary/15 text-club-primary';
      case 'maybe':
        return 'bg-club-secondary/15 text-club-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('event.noEvents')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        const status = rsvpStatus[event.id] || 'pending';

        return (
          <Card
            key={event.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getEventTypeColor(event.type)}>
                      {t(`event.types.${event.type}`)}
                    </Badge>
                    <Badge className={getRSVPStatusColor(status)}>
                      {t(`rsvp.status.${status}` as any)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  {event.opponent && (
                    <CardDescription className="mt-1">
                      vs {event.opponent}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
              {event.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{event.notes}</p>
              )}
              {onRSVP && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRSVP(event.id);
                    }}
                  >
                    {status === 'pending' ? t('rsvp.setRSVP') : t('common.buttons.edit')} RSVP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
