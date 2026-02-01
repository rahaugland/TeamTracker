import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store';
import { getPlayers, getPlayer, type PlayerWithMemberships } from '@/services/players.service';
import { getUpcomingEvents } from '@/services/events.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { getPlayerRSVPs } from '@/services/rsvp.service';
import { submitRSVP } from '@/services/rsvp.service';
import type { Player, Event, AttendanceRecord, Rsvp, RsvpStatus } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerScheduleView } from '@/components/player/PlayerScheduleView';
import { PlayerAttendanceHistory } from '@/components/player/PlayerAttendanceHistory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Users, TrendingUp, Award } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Player Dashboard Page
 * Simplified dashboard for players to view their schedule, RSVP to events,
 * and track their attendance
 */
export function PlayerDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerWithMemberships | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Find player record for this user
      const players = await getPlayers();
      const basicPlayer = players.find((p) => p.user_id === user.id);

      if (!basicPlayer) {
        setIsLoading(false);
        return;
      }

      // Get full player with team_memberships
      const playerRecord = await getPlayer(basicPlayer.id);
      if (!playerRecord) {
        setIsLoading(false);
        return;
      }

      setPlayer(playerRecord);

      // Get team IDs from player's memberships
      const teamIds = playerRecord.team_memberships?.map((tm) => tm.team_id) || [];

      // Load upcoming events for all teams
      const eventsPromises = teamIds.map((teamId: string) => getUpcomingEvents(teamId));
      const eventsResults = await Promise.all(eventsPromises);
      const allEvents = eventsResults.flat().sort((a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      setUpcomingEvents(allEvents);

      // Load attendance records
      const attendance = await getPlayerAttendance(playerRecord.id);
      setAttendanceRecords(attendance);

      // Load RSVPs
      const rsvpData = await getPlayerRSVPs(playerRecord.id);
      setRsvps(rsvpData);
    } catch (error) {
      console.error('Error loading player dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = (eventId: string) => {
    const existingRsvp = rsvps.find((r) => r.event_id === eventId);
    setSelectedEventId(eventId);
    setRsvpStatus(existingRsvp?.status || 'pending');
  };

  const handleSubmitRSVP = async () => {
    if (!selectedEventId || !player || !user) return;

    setIsSubmitting(true);
    try {
      await submitRSVP({
        event_id: selectedEventId,
        player_id: player.id,
        status: rsvpStatus,
        responded_by: user.id,
      });

      // Reload RSVPs
      const rsvpData = await getPlayerRSVPs(player.id);
      setRsvps(rsvpData);

      setSelectedEventId(null);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No player profile found. Please contact your coach.
            </p>
            <Button onClick={() => navigate('/join-team')}>{t('joinTeam.title')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rsvpStatusMap = rsvps.reduce((acc, rsvp) => {
    acc[rsvp.event_id] = rsvp.status;
    return acc;
  }, {} as Record<string, string>);

  const nextEvent = upcomingEvents[0];
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const totalEvents = attendanceRecords.length;
  const attendanceRate = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t('auth.profile.welcome', { name: player.name })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('player.singular')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.widgets.averageAttendance')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {presentCount} / {totalEvents} {t('dashboard.widgets.events')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.widgets.upcomingEvents')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.widgets.nextEvents', { count: upcomingEvents.length })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('team.plural')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {player.team_memberships?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Practice/Game */}
      {nextEvent && (
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Next Event</CardTitle>
            <CardDescription>{nextEvent.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{t('common.labels.date')}:</span>{' '}
                  {format(new Date(nextEvent.start_time), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t('common.labels.time')}:</span>{' '}
                  {format(new Date(nextEvent.start_time), 'HH:mm')}
                </p>
                {nextEvent.location && (
                  <p className="text-sm">
                    <span className="font-medium">{t('common.labels.location')}:</span>{' '}
                    {nextEvent.location}
                  </p>
                )}
              </div>
              <Button onClick={() => handleRSVP(nextEvent.id)}>
                {rsvpStatusMap[nextEvent.id] === 'pending'
                  ? t('rsvp.setRSVP')
                  : t('common.buttons.edit') + ' RSVP'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('navigation.schedule')}</h2>
          <PlayerScheduleView
            events={upcomingEvents.slice(0, 5)}
            rsvpStatus={rsvpStatusMap}
            onRSVP={handleRSVP}
          />
          {upcomingEvents.length > 5 && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/schedule')}
            >
              View All Events
            </Button>
          )}
        </div>

        {/* Attendance History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('player.attendance')}</h2>
          <PlayerAttendanceHistory
            attendanceRecords={attendanceRecords}
            totalEvents={totalEvents}
          />
        </div>
      </div>

      {/* RSVP Dialog */}
      <Dialog open={!!selectedEventId} onOpenChange={() => setSelectedEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rsvp.setRSVP')}</DialogTitle>
            <DialogDescription>
              Update your RSVP status for this event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rsvp-status">{t('common.labels.status')}</Label>
              <Select
                value={rsvpStatus}
                onValueChange={(value: RsvpStatus) => setRsvpStatus(value)}
              >
                <SelectTrigger id="rsvp-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attending">{t('rsvp.status.attending')}</SelectItem>
                  <SelectItem value="not_attending">
                    {t('rsvp.status.not_attending')}
                  </SelectItem>
                  <SelectItem value="maybe">{t('rsvp.status.maybe')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEventId(null)}
                className="flex-1"
              >
                {t('common.buttons.cancel')}
              </Button>
              <Button
                onClick={handleSubmitRSVP}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? t('common.messages.saving') : t('common.buttons.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
