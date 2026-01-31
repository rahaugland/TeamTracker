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
import { formatDateTimeForDatabase } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventForm } from '@/components/forms/EventForm';
import { EmptyState } from '@/components/common/EmptyState';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Calendar, List } from 'lucide-react';
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
  }, [selectedType, events]);

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
    if (selectedType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((event) => event.type === selectedType));
    }
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
      other: 'bg-gray-500 text-white',
    };
    return colors[type];
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
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="gradient-primary px-4 py-12 mb-8 shadow-lg">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{t('navigation.schedule')}</h1>
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
                <p className="text-white/90 text-lg">{activeTeam.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4 mr-2" />
              {t('calendar.listView')}
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('calendar.calendarView')}
            </Button>
          </div>
          {isCoach && (
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="shadow-xl">
              {t('event.addEvent')}
            </Button>
          )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-8">
      {viewMode === 'calendar' ? (
        <>
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as EventType | 'all')} className="mb-6">
            <TabsList>
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
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as EventType | 'all')}>
          <TabsList>
            <TabsTrigger value="all">{t('common.labels.all')}</TabsTrigger>
            <TabsTrigger value="practice">{t('event.types.practice')}</TabsTrigger>
            <TabsTrigger value="game">{t('event.types.game')}</TabsTrigger>
            <TabsTrigger value="tournament">{t('event.types.tournament')}</TabsTrigger>
            <TabsTrigger value="meeting">{t('event.types.meeting')}</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            {filteredEvents.length === 0 ? (
              <EmptyState
                title={t('event.noEvents')}
                description={t('event.noEventsDescription')}
              />
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getEventTypeColor(event.type)}`}>
                              {t(`event.types.${event.type}`)}
                            </span>
                            {event.opponent && (
                              <span className="text-sm text-muted-foreground">
                                vs {event.opponent}
                              </span>
                            )}
                          </div>
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription>
                            {formatDateTime(event.start_time)}
                            {event.location && ` • ${event.location}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {event.notes && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.notes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
