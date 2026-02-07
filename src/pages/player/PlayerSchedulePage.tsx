import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, isToday, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronsDown } from 'lucide-react';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { getUpcomingEvents } from '@/services/events.service';
import { getPlayerRSVPs } from '@/services/rsvp.service';
import { ScheduleItem } from '@/components/schedule/ScheduleItem';
import { QuickRSVPButtons } from '@/components/player/QuickRSVPButtons';
import { cn } from '@/lib/utils';
import type { Event, Rsvp } from '@/types/database.types';

export function PlayerSchedulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { player, teamIds, isLoading: playerLoading } = usePlayerContext();

  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'game' | 'practice'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const thisWeekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!player || teamIds.length === 0) return;
    loadSchedule();
  }, [player?.id, teamIds.join(',')]);

  const loadSchedule = async () => {
    if (!player) return;
    setIsLoading(true);
    try {
      const [eventsResults, rsvpData] = await Promise.all([
        Promise.all(teamIds.map((teamId) => getUpcomingEvents(teamId))),
        getPlayerRSVPs(player.id),
      ]);

      const allEvents = eventsResults.flat().sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      setEvents(allEvents);
      setRsvps(rsvpData);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rsvpMap = rsvps.reduce((acc, r) => {
    acc[r.event_id] = r.status;
    return acc;
  }, {} as Record<string, string>);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.start_time);
    const inMonth = eventDate >= monthStart && eventDate <= monthEnd;
    if (!inMonth) return false;
    if (filterType === 'all') return true;
    if (filterType === 'game') return event.type === 'game' || event.type === 'tournament';
    return event.type === 'practice';
  });

  const scrollToThisWeek = () => {
    thisWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (playerLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  // Find the first event that is today or in the future for the "This Week" marker
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'game', 'practice'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wide transition-all',
              filterType === type
                ? 'bg-club-primary text-white'
                : 'bg-white/[0.06] text-white/50 hover:text-white/70'
            )}
          >
            {type === 'all' ? t('common.labels.all') : t(`event.types.${type}`)}
          </button>
        ))}
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          <p className="text-sm">{t('event.noEvents')}</p>
        </div>
      ) : (
        <div className="space-y-2 scroll-smooth">
          {filteredEvents.map((event) => {
            const dt = new Date(event.start_time);
            const today = isToday(dt);
            const isMatch = event.type === 'game' || event.type === 'tournament';
            const eventDateStr = format(dt, 'yyyy-MM-dd');
            const isThisWeekMarker = eventDateStr === todayStr;

            return (
              <div key={event.id} ref={isThisWeekMarker ? thisWeekRef : undefined}>
                <ScheduleItem
                  day={format(dt, 'd')}
                  month={format(dt, 'MMM')}
                  title={event.title}
                  meta={`${format(dt, 'HH:mm')}${event.location ? ` · ${event.location}` : ''}`}
                  type={isMatch ? 'match' : 'practice'}
                  isToday={today}
                  onClick={() => navigate(`/events/${event.id}`)}
                  actions={
                    player ? (
                      <QuickRSVPButtons
                        eventId={event.id}
                        playerId={player.id}
                        currentStatus={rsvpMap[event.id]}
                      />
                    ) : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Floating "This Week" button */}
      {filteredEvents.some((e) => isToday(new Date(e.start_time))) && (
        <button
          onClick={scrollToThisWeek}
          className="fixed bottom-20 right-4 lg:bottom-6 bg-club-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wide z-30"
        >
          <ChevronsDown className="w-4 h-4" />
          {t('calendar.today')}
        </button>
      )}
    </div>
  );
}
