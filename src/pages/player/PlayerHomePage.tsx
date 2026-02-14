import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { getUpcomingEvents } from '@/services/events.service';
import { getPlayerRSVPs } from '@/services/rsvp.service';
import { getPlayerGoals } from '@/services/player-goals.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { calculatePlayerRating, getPlayerStats } from '@/services/player-stats.service';
import { FifaCardCompact } from '@/components/player-stats/FifaCardCompact';
import { NextEventHero } from '@/components/player/NextEventHero';
import { QuickStatsGrid } from '@/components/player/QuickStatsGrid';
import { ScheduleItem } from '@/components/schedule/ScheduleItem';
import { QuickRSVPButtons } from '@/components/player/QuickRSVPButtons';
import { AnnouncementsFeed } from '@/components/player/AnnouncementsFeed';
import { JoinTeamCard } from '@/components/player/JoinTeamCard';
import { PendingMemberships } from '@/components/player/PendingMemberships';
import type { Event, Rsvp, PlayerGoal, AttendanceRecord } from '@/types/database.types';
import type { PlayerRating } from '@/services/player-stats.service';

export function PlayerHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { player, teamIds, isLoading: playerLoading, hasActiveTeams, hasPendingTeams, refreshPlayer } = usePlayerContext();

  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const { announcements, pinnedAnnouncements } = useAnnouncements(teamIds);

  useEffect(() => {
    if (!player || !hasActiveTeams) {
      setIsLoading(false);
      return;
    }
    loadHomeData();
  }, [player?.id, teamIds.join(',')]);

  const loadHomeData = async () => {
    if (!player) return;
    setIsLoading(true);

    try {
      // Fetch events for all teams
      const eventsResults = await Promise.all(
        teamIds.map((teamId) => getUpcomingEvents(teamId))
      );
      const allEvents = eventsResults.flat().sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      setEvents(allEvents);

      // Fetch RSVPs, goals, attendance, stats in parallel
      const [rsvpData, attendanceData, statsEntries] = await Promise.all([
        getPlayerRSVPs(player.id),
        getPlayerAttendance(player.id),
        getPlayerStats(player.id, 'career').catch(() => []),
      ]);

      setRsvps(rsvpData);

      // Attendance rate
      const presentCount = attendanceData.filter((r) => r.status === 'present').length;
      const total = attendanceData.length;
      setAttendanceRate(total > 0 ? Math.round((presentCount / total) * 100) : 0);

      // Attendance streak
      const sorted = [...attendanceData].sort(
        (a: AttendanceRecord, b: AttendanceRecord) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      let s = 0;
      for (const record of sorted) {
        if (record.status === 'present') s++;
        else break;
      }
      setStreak(s);

      // Rating
      if (statsEntries.length > 0) {
        const position = player.positions?.[0] || 'all_around';
        const playerRating = calculatePlayerRating(statsEntries, position);
        setRating(playerRating);
        setGamesPlayed(playerRating.gamesPlayed);
      }

      // Goals
      if (teamIds.length > 0) {
        try {
          const goalsData = await getPlayerGoals(player.id, teamIds[0]);
          setGoals(goalsData);
        } catch {
          // Goals may not exist
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rsvpMap = rsvps.reduce((acc, r) => {
    acc[r.event_id] = r.status;
    return acc;
  }, {} as Record<string, string>);

  if (playerLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player || !hasActiveTeams) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-display font-bold uppercase tracking-wider">
          {t('auth.profile.welcome', { name: player?.name || '' })}
        </h1>
        {player && hasPendingTeams && (
          <PendingMemberships refreshKey={refreshKey} />
        )}
        <JoinTeamCard onJoined={() => { setRefreshKey((k) => k + 1); refreshPlayer(); }} />
        {!hasPendingTeams && <PendingMemberships refreshKey={refreshKey} />}
      </div>
    );
  }

  const nextEvent = events[0];
  const activeGoals = goals.filter((g) => !g.completed_at).length;

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto space-y-5">
      {/* Hero Grid: FIFA Card left, event info right on desktop */}
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
        {/* Left column: FIFA Card */}
        <div>
          {rating && (
            <FifaCardCompact
              overallRating={rating.overall}
              subRatings={rating.subRatings}
              position={player.positions?.[0] || 'all_around'}
              playerName={player.name}
              photoUrl={player.photo_url || undefined}
              isProvisional={rating.isProvisional}
            />
          )}
        </div>

        {/* Right column: Pinned Announcements, Next Event, Quick Stats */}
        <div className="space-y-5">
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <AnnouncementsFeed announcements={pinnedAnnouncements} showPinnedOnly />
          )}

          {/* Next Event Hero */}
          {nextEvent && (
            <NextEventHero
              event={nextEvent}
              playerId={player.id}
              currentRsvpStatus={rsvpMap[nextEvent.id]}
              onRsvpChange={loadHomeData}
            />
          )}

          {/* Quick Stats Grid */}
          <QuickStatsGrid
            streak={streak}
            attendanceRate={attendanceRate}
            activeGoals={activeGoals}
            gamesPlayed={gamesPlayed}
          />
        </div>
      </div>

      {/* Schedule Preview */}
      {events.length > 1 && (
        <div>
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('navigation.schedule')}
          </h2>
          <div className="space-y-2">
            {events.slice(1, 5).map((event) => {
              const dt = new Date(event.start_time);
              const scheduleType = event.type === 'tournament' ? 'tournament' : event.type === 'game' ? 'match' : 'practice';
              return (
                <ScheduleItem
                  key={event.id}
                  day={format(dt, 'd')}
                  month={format(dt, 'MMM')}
                  title={event.title}
                  meta={`${format(dt, 'HH:mm')}${event.location ? ` · ${event.location}` : ''}`}
                  type={scheduleType}
                  onClick={() => navigate(`/events/${event.id}`)}
                  actions={
                    <QuickRSVPButtons
                      eventId={event.id}
                      playerId={player.id}
                      currentStatus={rsvpMap[event.id]}
                    />
                  }
                />
              );
            })}
          </div>
          {events.length > 5 && (
            <button
              onClick={() => navigate('/player/schedule')}
              className="w-full mt-3 py-2.5 rounded-lg border border-white/10 text-sm font-display font-bold uppercase tracking-wide text-white/70 hover:bg-white/[0.04] transition-colors"
            >
              {t('playerExperience.home.viewAllEvents')}
            </button>
          )}
        </div>
      )}

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <div>
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('playerExperience.announcements.title')}
          </h2>
          <AnnouncementsFeed announcements={announcements.slice(0, 3)} />
        </div>
      )}
    </div>
  );
}
