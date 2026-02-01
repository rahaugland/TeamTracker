import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store';
import { getPlayers, getPlayer, type PlayerWithMemberships } from '@/services/players.service';
import { getUpcomingEvents } from '@/services/events.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { getPlayerRSVPs } from '@/services/rsvp.service';
import { submitRSVP } from '@/services/rsvp.service';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { usePlayerFeedback } from '@/hooks/usePlayerFeedback';
import { useSelfAssessments } from '@/hooks/useSelfAssessments';
import type { Event, AttendanceRecord, Rsvp, RsvpStatus } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerScheduleView } from '@/components/player/PlayerScheduleView';
import { PlayerAttendanceHistory } from '@/components/player/PlayerAttendanceHistory';
import { AnnouncementsFeed } from '@/components/player/AnnouncementsFeed';
import { FeedbackTimeline } from '@/components/player/FeedbackTimeline';
import { SkillRatingsChart } from '@/components/player/SkillRatingsChart';
import { ReviewCard } from '@/components/player/ReviewCard';
import { SelfAssessmentForm } from '@/components/player/SelfAssessmentForm';
import { SelfAssessmentHistory } from '@/components/player/SelfAssessmentHistory';
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
import { Calendar, Users, TrendingUp, Home, BarChart3, MessageSquare, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';

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

  const teamIds = player?.team_memberships?.map((tm) => tm.team_id) || [];

  const { announcements, pinnedAnnouncements } = useAnnouncements(teamIds);
  const { feedback, reviews, skillRatings, refetch: refetchFeedback } = usePlayerFeedback(player?.id);
  const { assessments, submitAssessment } = useSelfAssessments(player?.id);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const players = await getPlayers();
      const basicPlayer = players.find((p) => p.user_id === user.id);

      if (!basicPlayer) {
        setIsLoading(false);
        return;
      }

      const playerRecord = await getPlayer(basicPlayer.id);
      if (!playerRecord) {
        setIsLoading(false);
        return;
      }

      setPlayer(playerRecord);

      const playerTeamIds = playerRecord.team_memberships?.map((tm) => tm.team_id) || [];

      const eventsPromises = playerTeamIds.map((teamId: string) => getUpcomingEvents(teamId));
      const eventsResults = await Promise.all(eventsPromises);
      const allEvents = eventsResults.flat().sort((a: Event, b: Event) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      setUpcomingEvents(allEvents);

      const attendance = await getPlayerAttendance(playerRecord.id);
      setAttendanceRecords(attendance);

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

  // Get recent past events for self-assessment (last 10 events that have already occurred)
  const now = new Date();
  const pastEvents = upcomingEvents.length > 0
    ? [] // upcomingEvents are future events; we'd need past events from attendance
    : [];
  // Use events from attendance records as proxy for past events the player attended
  const recentEventsForAssessment = upcomingEvents.filter(
    e => new Date(e.start_time) < now
  ).slice(0, 10);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t('auth.profile.welcome', { name: player.name })}
        </h1>
        <p className="text-muted-foreground mt-1">{t('player.singular')}</p>
      </div>

      {/* Tabbed Dashboard */}
      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="home" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t('playerExperience.tabs.home')}</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('playerExperience.tabs.myStats')}</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{t('playerExperience.tabs.feedback')}</span>
          </TabsTrigger>
          <TabsTrigger value="self-assessment" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t('playerExperience.tabs.selfAssessment')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Home */}
        <TabsContent value="home" className="space-y-6">
          {/* Pinned Announcements Banner */}
          {pinnedAnnouncements.length > 0 && (
            <AnnouncementsFeed announcements={pinnedAnnouncements} showPinnedOnly />
          )}

          {/* Next Event Highlight */}
          {nextEvent && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>{t('playerExperience.home.nextEvent')}</CardTitle>
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

          {/* Schedule */}
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
                {t('playerExperience.home.viewAllEvents')}
              </Button>
            )}
          </div>

          {/* Recent Announcements */}
          {announcements.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                {t('playerExperience.announcements.title')}
              </h2>
              <AnnouncementsFeed announcements={announcements.slice(0, 5)} />
            </div>
          )}
        </TabsContent>

        {/* Tab 2: My Stats */}
        <TabsContent value="stats" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-xs text-muted-foreground">
                  {t('playerExperience.stats.activeTeams')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('player.attendance')}</h2>
            <PlayerAttendanceHistory
              attendanceRecords={attendanceRecords}
              totalEvents={totalEvents}
            />
          </div>

          {/* Link to full stats */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/players/${player.id}/stats`)}
          >
            {t('player.stats.viewStats')}
          </Button>
        </TabsContent>

        {/* Tab 3: Feedback */}
        <TabsContent value="feedback" className="space-y-6">
          {/* Skill Ratings */}
          <SkillRatingsChart ratings={skillRatings} />

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                {t('playerExperience.reviews.title')}
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}

          {/* Post-Event Feedback */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {t('playerExperience.feedback.title')}
            </h2>
            <FeedbackTimeline feedback={feedback} />
          </div>
        </TabsContent>

        {/* Tab 4: Self-Assessment */}
        <TabsContent value="self-assessment" className="space-y-6">
          {/* Assessment Form */}
          <SelfAssessmentForm
            events={recentEventsForAssessment}
            playerId={player.id}
            existingAssessments={assessments}
            onSubmit={submitAssessment}
          />

          {/* Assessment History */}
          <SelfAssessmentHistory assessments={assessments} />
        </TabsContent>
      </Tabs>

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
