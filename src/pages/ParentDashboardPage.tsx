import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store';
import { getLinkedPlayers, createParentLink } from '@/services/parent-links.service';
import { getUpcomingEvents } from '@/services/events.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { getPlayerRSVPs, submitRSVP } from '@/services/rsvp.service';
import { searchPlayers } from '@/services/players.service';
import type { LinkedPlayerWithDetails } from '@/services/parent-links.service';
import type { Event, AttendanceRecord, Rsvp, RsvpStatus, Player } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LinkedPlayerCard } from '@/components/parent/LinkedPlayerCard';
import { PlayerScheduleView } from '@/components/player/PlayerScheduleView';
import { PlayerAttendanceHistory } from '@/components/player/PlayerAttendanceHistory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Users, Calendar } from 'lucide-react';

/**
 * Parent Dashboard Page
 * Dashboard for parents to view their children's schedules and manage RSVPs
 */
export function ParentDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [linkedPlayers, setLinkedPlayers] = useState<LinkedPlayerWithDetails[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  useEffect(() => {
    if (linkedPlayers.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(linkedPlayers[0].id);
    }
  }, [linkedPlayers, selectedPlayerId]);

  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerData(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const players = await getLinkedPlayers(user.id);
      setLinkedPlayers(players);
    } catch (error) {
      console.error('Error loading parent dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlayerData = async (playerId: string) => {
    try {
      const player = linkedPlayers.find((p) => p.id === playerId);
      if (!player) return;

      // Get team IDs
      const teamIds = player.team_memberships?.map((tm) => tm.team_id) || [];

      // Load upcoming events for all teams
      const eventsPromises = teamIds.map((teamId) => getUpcomingEvents(teamId));
      const eventsResults = await Promise.all(eventsPromises);
      const allEvents = eventsResults.flat().sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      setUpcomingEvents(allEvents);

      // Load attendance records
      const attendance = await getPlayerAttendance(playerId);
      setAttendanceRecords(attendance);

      // Load RSVPs
      const rsvpData = await getPlayerRSVPs(playerId);
      setRsvps(rsvpData);
    } catch (error) {
      console.error('Error loading player data:', error);
    }
  };

  const handleSearchPlayers = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchPlayers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkPlayer = async (playerId: string) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await createParentLink({
        parent_id: user.id,
        child_id: playerId,
      });

      // Reload linked players
      await loadDashboardData();
      setShowLinkDialog(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error linking player:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRSVP = (eventId: string) => {
    const existingRsvp = rsvps.find((r) => r.event_id === eventId);
    setSelectedEventId(eventId);
    setRsvpStatus(existingRsvp?.status || 'pending');
  };

  const handleSubmitRSVP = async () => {
    if (!selectedEventId || !selectedPlayerId || !user) return;

    setIsSubmitting(true);
    try {
      await submitRSVP({
        event_id: selectedEventId,
        player_id: selectedPlayerId,
        status: rsvpStatus,
        responded_by: user.id,
      });

      // Reload RSVPs
      const rsvpData = await getPlayerRSVPs(selectedPlayerId);
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

  const selectedPlayer = linkedPlayers.find((p) => p.id === selectedPlayerId);
  const rsvpStatusMap = rsvps.reduce((acc, rsvp) => {
    acc[rsvp.event_id] = rsvp.status;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider">
          {t('auth.profile.welcome', { name: user?.name || 'Parent' })}
        </h1>
        <p className="text-muted-foreground mt-1 font-display tracking-wide">Parent Dashboard</p>
      </div>

      {linkedPlayers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No linked players yet. Link your child's player profile to get started.
            </p>
            <Button onClick={() => setShowLinkDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Link Player
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Linked Players */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">My Players</h2>
              <Button variant="outline" onClick={() => setShowLinkDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Link Another Player
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedPlayers.map((player) => (
                <LinkedPlayerCard
                  key={player.id}
                  player={player}
                  onViewSchedule={(id) => setSelectedPlayerId(id)}
                />
              ))}
            </div>
          </div>

          {/* Selected Player Details */}
          {selectedPlayer && (
            <>
              <div className="mb-6">
                <Label htmlFor="player-select">Viewing schedule for:</Label>
                <Select value={selectedPlayerId || ''} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger id="player-select" className="w-full md:w-96">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedPlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <div>
                  <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-4">{t('navigation.schedule')}</h2>
                  {upcomingEvents.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('event.noEvents')}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Attendance History */}
                <div>
                  <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-4">{t('player.attendance')}</h2>
                  <PlayerAttendanceHistory
                    attendanceRecords={attendanceRecords}
                    totalEvents={attendanceRecords.length}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Link Player Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Player</DialogTitle>
            <DialogDescription>
              Search for your child's player profile and link it to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPlayers()}
              />
              <Button onClick={handleSearchPlayers} disabled={isSearching}>
                {isSearching ? t('common.messages.loading') : t('common.buttons.search')}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((player) => {
                  const isLinked = linkedPlayers.some((lp) => lp.id === player.id);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{player.name}</p>
                        {player.email && (
                          <p className="text-sm text-muted-foreground">{player.email}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkPlayer(player.id)}
                        disabled={isLinked || isSubmitting}
                      >
                        {isLinked ? 'Linked' : 'Link'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* RSVP Dialog */}
      <Dialog open={!!selectedEventId} onOpenChange={() => setSelectedEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rsvp.setRSVP')}</DialogTitle>
            <DialogDescription>
              Update RSVP status for {selectedPlayer?.name}
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
