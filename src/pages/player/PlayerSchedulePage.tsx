import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, isToday, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronsDown, CalendarDays, List } from 'lucide-react';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { PendingMemberships } from '@/components/player/PendingMemberships';
import { getUpcomingEvents } from '@/services/events.service';
import { getPlayerRSVPs } from '@/services/rsvp.service';
import { ScheduleItem } from '@/components/schedule/ScheduleItem';
import { QuickRSVPButtons } from '@/components/player/QuickRSVPButtons';
import { CalendarView } from '@/components/calendar/CalendarView';
import { cn } from '@/lib/utils';
import type { Event, Rsvp } from '@/types/database.types';

function RsvpSummaryCards({
  filteredEvents,
  rsvpMap,
}: {
  filteredEvents: Event[];
  rsvpMap: Record<string, string>;
}) {
  const { t } = useTranslation();
  const { total, confirmed, pending, declined } = useMemo(() => {
    let confirmed = 0;
    let declined = 0;
    let pending = 0;
    for (const event of filteredEvents) {
      const status = rsvpMap[event.id];
      if (status === 'attending') {
        confirmed++;
      } else if (status === 'not_attending') {
        declined++;
      } else {
        pending++;
      }
    }
    return { total: filteredEvents.length, confirmed, pending, declined };
  }, [filteredEvents, rsvpMap]);

  const cards = [
    { label: t('playerExperience.schedule.eventsThisMonth'), count: total, valueColor: 'text-vq-teal', barColor: 'bg-vq-teal' },
    { label: t('playerExperience.schedule.confirmed'), count: confirmed, valueColor: 'text-emerald-400', barColor: 'bg-emerald-500' },
    { label: t('playerExperience.schedule.pendingRsvp'), count: pending, valueColor: 'text-amber-400', barColor: 'bg-amber-500' },
    { label: t('playerExperience.schedule.cantAttend'), count: declined, valueColor: 'text-red-400', barColor: 'bg-red-500' },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-white/[0.06] bg-navy-90 p-3"
        >
          <div className={cn('h-1 w-8 rounded-full mb-2', card.barColor)} />
          <div className={cn('text-2xl font-mono font-bold', card.valueColor)}>{card.count}</div>
          <div className="text-xs font-display text-white/60 mt-0.5">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

export function PlayerSchedulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { player, teamIds, isLoading: playerLoading, hasActiveTeams, hasPendingTeams } = usePlayerContext();

  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'game' | 'practice'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
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

  if (!hasActiveTeams && hasPendingTeams) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-6">
        <PendingMemberships />
      </div>
    );
  }

  // Find the first event that is today or in the future for the "This Week" marker
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto space-y-4">
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

      {/* Filter tabs + Calendar toggle */}
      <div className="flex items-center gap-2">
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

        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wide bg-white/[0.06] text-white/50 hover:text-white/70 transition-all"
        >
          {viewMode === 'list' ? (
            <>
              <CalendarDays className="w-3.5 h-3.5" />
              {t('calendar.calendarView')}
            </>
          ) : (
            <>
              <List className="w-3.5 h-3.5" />
              {t('calendar.listView')}
            </>
          )}
        </button>
      </div>

      {/* RSVP Summary Cards */}
      <RsvpSummaryCards filteredEvents={filteredEvents} rsvpMap={rsvpMap} />

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <CalendarView events={filteredEvents} />
      ) : (
        <>
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
                const isTournament = event.type === 'tournament';
                const isMatch = event.type === 'game';
                const eventDateStr = format(dt, 'yyyy-MM-dd');
                const isThisWeekMarker = eventDateStr === todayStr;
                const isDeclined = rsvpMap[event.id] === 'not_attending';

                return (
                  <div
                    key={event.id}
                    ref={isThisWeekMarker ? thisWeekRef : undefined}
                    className={cn(isDeclined && 'opacity-60')}
                  >
                    <ScheduleItem
                      day={format(dt, 'd')}
                      month={format(dt, 'MMM')}
                      title={event.title}
                      meta={`${format(dt, 'HH:mm')}${event.location ? ` · ${event.location}` : ''}`}
                      type={isTournament ? 'tournament' : isMatch ? 'match' : 'practice'}
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
        </>
      )}

      {/* Floating "This Week" button */}
      {viewMode === 'list' && filteredEvents.some((e) => isToday(new Date(e.start_time))) && (
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
