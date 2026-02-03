import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeams, useAuth, useSeasons } from '@/store';
import { getEventsByTeam, createEvent, createRecurringEvents } from '@/services/events.service';
import type { CreateEventInput } from '@/services/events.service';
import { getActiveSeason } from '@/services/seasons.service';
import { getTeams } from '@/services/teams.service';
import type { Event, EventType } from '@/types/database.types';
import type { EventFormData } from '@/lib/validations/event';
import { formatDateTimeForDatabase, format, parseISO, isToday as checkIsToday } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventForm } from '@/components/forms/EventForm';
import { EmptyState } from '@/components/common/EmptyState';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ScheduleItem, type ScheduleItemType } from '@/components/schedule';
import { Calendar, List, History, Clock, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * SchedulePage component
 * Displays and manages events for the active team
 */
export function SchedulePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { teams, activeTeamId, getActiveTeam, setActiveTeam, setTeams } = useTeams();
  const { activeSeason, setActiveSeason } = useSeasons();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [showPast, setShowPast] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTeam = getActiveTeam();
  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  useEffect(() => {
    loadTeamsData();
  }, []);

  useEffect(() => {
    // Auto-select first team if no active team is set
    if (!activeTeamId && teams.length > 0) {
      setActiveTeam(teams[0].id);
    }
  }, [activeTeamId, teams, setActiveTeam]);

  useEffect(() => {
    if (activeTeamId) {
      loadEvents(activeTeamId);
    } else {
      setIsLoading(false);
    }
  }, [activeTeamId]);

  const loadTeamsData = async () => {
    try {
      const activeSeasonData = await getActiveSeason();
      setActiveSeason(activeSeasonData);

      if (activeSeasonData) {
        const teamsData = await getTeams(activeSeasonData.id);
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  useEffect(() => {
    filterEvents();
  }, [selectedType, events, showPast]);

  const loadEvents = async (teamId: string) => {
    setIsLoading(true);
    try {
      const data = await getEventsByTeam(teamId);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    const now = new Date();
    let filtered = events;

    // Filter by time: upcoming vs past
    if (!showPast) {
      filtered = filtered.filter((event) => new Date(event.start_time) >= now);
    } else {
      filtered = filtered.filter((event) => new Date(event.start_time) < now);
      // Show most recent past events first
      filtered = [...filtered].reverse();
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((event) => event.type === selectedType);
    }

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async (data: EventFormData) => {
    if (!activeTeamId || !user?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const eventInput: CreateEventInput = {
        team_id: activeTeamId,
        type: data.type,
        title: data.title,
        start_time: formatDateTimeForDatabase(data.startTime),
        end_time: formatDateTimeForDatabase(data.endTime),
        created_by: user.id,
        ...(data.location ? { location: data.location } : {}),
        ...(data.opponent ? { opponent: data.opponent } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
      };

      // Check if this is a recurring practice
      if (data.isRecurring && data.type === 'practice' && data.recurringDays && data.recurringDays.length > 0 && data.recurringWeeks) {
        await createRecurringEvents(
          eventInput,
          data.recurringDays,
          data.recurringWeeks
        );
      } else {
        await createEvent(eventInput);
      }

      await loadEvents(activeTeamId);
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeColor = (type: EventType) => {
    const colors: Record<EventType, string> = {
      practice: 'status-info',
      game: 'status-success',
      tournament: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      meeting: 'status-warning',
      other: 'bg-muted-foreground text-white',
    };
    return colors[type];
  };

  // Helper to map EventType to ScheduleItemType
  const mapEventTypeToScheduleType = (type: EventType): ScheduleItemType => {
    if (type === 'game' || type === 'tournament') return 'match';
    return 'practice';
  };

  // Format event meta information
  const formatEventMeta = (event: Event): string => {
    const time = format(parseISO(event.start_time), 'HH:mm');
    const endTime = format(parseISO(event.end_time), 'HH:mm');
    const timeRange = `${time} - ${endTime}`;

    if (event.location) {
      return `${event.location}, ${timeRange}`;
    }
    return timeRange;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <EmptyState
          title={t('schedule.noActiveTeam')}
          description={t('schedule.noActiveTeamDescription')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      {/* Page Header */}
      <div className="px-4 py-8 mb-6">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-extrabold uppercase tracking-wider text-white mb-2">
                  {t('navigation.schedule')}
                </h1>
                {teams.length > 1 ? (
                  <Select value={activeTeamId || ''} onValueChange={setActiveTeam}>
                    <SelectTrigger className="w-full sm:w-64 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder={t('team.selectTeam')} />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white/60 text-sm">
                    {activeTeam.name} • {format(new Date(), 'MMMM yyyy')}
                  </p>
                )}
              </div>
              {isCoach && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  className="bg-club-primary hover:bg-club-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('event.addEvent')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-8">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}
          >
            <List className="h-4 w-4 mr-2" />
            {t('calendar.listView')}
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('calendar.calendarView')}
          </Button>
        </div>

        {viewMode === 'calendar' ? (
          <>
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as EventType | 'all')} className="mb-6">
              <TabsList className="bg-navy-80 border-white/5">
                <TabsTrigger value="all">{t('common.labels.all')}</TabsTrigger>
                <TabsTrigger value="practice">{t('event.types.practice')}</TabsTrigger>
                <TabsTrigger value="game">{t('event.types.game')}</TabsTrigger>
                <TabsTrigger value="tournament">{t('event.types.tournament')}</TabsTrigger>
                <TabsTrigger value="meeting">{t('event.types.meeting')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <CalendarView events={filteredEvents} />
          </>
        ) : (
          <div className="bg-navy-90 rounded-lg border border-white/[0.04] overflow-hidden">
            {/* Card Header with Filter Tabs and Time Toggle */}
            <div className="p-4 border-b border-white/[0.04]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as EventType | 'all')} className="flex-1">
                  <TabsList className="bg-navy-80 border-white/5">
                    <TabsTrigger value="all">{t('common.labels.all')}</TabsTrigger>
                    <TabsTrigger value="practice">{t('event.types.practice')}</TabsTrigger>
                    <TabsTrigger value="game">{t('event.types.game')}</TabsTrigger>
                    <TabsTrigger value="tournament">{t('event.types.tournament')}</TabsTrigger>
                    <TabsTrigger value="meeting">{t('event.types.meeting')}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                  <Button
                    variant={!showPast ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowPast(false)}
                    className={!showPast ? 'bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {t('schedule.upcoming')}
                  </Button>
                  <Button
                    variant={showPast ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowPast(true)}
                    className={showPast ? 'bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {t('schedule.past')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Schedule List */}
            <div className="p-4">
              {filteredEvents.length === 0 ? (
                <EmptyState
                  title={t('event.noEvents')}
                  description={t('event.noEventsDescription')}
                />
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const eventDate = parseISO(event.start_time);
                    const isEventToday = checkIsToday(eventDate);

                    return (
                      <ScheduleItem
                        key={event.id}
                        day={format(eventDate, 'dd')}
                        month={format(eventDate, 'MMM')}
                        title={event.opponent ? `vs ${event.opponent}` : event.title}
                        meta={formatEventMeta(event)}
                        type={mapEventTypeToScheduleType(event.type)}
                        isToday={isEventToday}
                        onClick={() => navigate(`/events/${event.id}`)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('event.addEvent')}</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
