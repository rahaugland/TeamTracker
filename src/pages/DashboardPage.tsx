import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, isToday, parseISO, differenceInDays } from 'date-fns';
import { useAuth, useSeasons, useTeams, usePlayers } from '@/store';
import { getActiveSeason } from '@/services/seasons.service';
import { getTeams } from '@/services/teams.service';
import { getPlayers, getPlayersByTeam } from '@/services/players.service';
import { getUpcomingEvents, getEventsByTeam } from '@/services/events.service';
import { getRSVPSummary, getEventRSVPs } from '@/services/rsvp.service';
import { getFormStreak } from '@/services/team-stats.service';
import { getPracticePlansByTeam } from '@/services/practice-plans.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard, TodayEventCard } from '@/components/dashboard';
import {
  ExpansionContainer,
  AttendanceExpansionPanel,
  WinRateExpansionPanel,
  ActivePlayersExpansionPanel,
  NextMatchExpansionPanel,
} from '@/components/dashboard/expansion';
import { ScheduleItem } from '@/components/schedule';
import { PlayerAvatar } from '@/components/player';
import type { Event, Player } from '@/types/database.types';

type ExpandedPanel = 'attendance' | 'winRate' | 'activePlayers' | 'nextMatch' | null;

interface PlayerWithAttendance {
  id: string;
  name: string;
  initials: string;
  position: string;
  attendance: number;
  form: 'good' | 'poor';
}

/**
 * Dashboard page - Redesigned to match VolleyQuest coach wireframes
 * Main landing page showing today's event, stats, schedule, and roster overview
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeSeason, setActiveSeason } = useSeasons();
  const { teams, setTeams, activeTeamId } = useTeams();
  const { setPlayers } = usePlayers();

  const [isLoading, setIsLoading] = useState(true);
  const [todayEvent, setTodayEvent] = useState<Event | null>(null);
  const [rsvpSummary, setRsvpSummary] = useState({ attending: 0, not_attending: 0, pending: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [playersWithAttendance, setPlayersWithAttendance] = useState<PlayerWithAttendance[]>([]);
  const [attendanceSortOrder, setAttendanceSortOrder] = useState<'asc' | 'desc'>('desc');
  const [winRate, setWinRate] = useState(0);
  const [nextMatch, setNextMatch] = useState<Event | null>(null);
  const [todayPracticePlan, setTodayPracticePlan] = useState<{ name: string; drillCount: number; totalMinutes: number } | null>(null);
  const [lowAttendancePlayer, setLowAttendancePlayer] = useState<PlayerWithAttendance | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);

  const selectedTeam = useMemo(() => {
    if (activeTeamId) {
      return teams.find(t => t.id === activeTeamId) || teams[0];
    }
    return teams.length > 0 ? teams[0] : null;
  }, [teams, activeTeamId]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // First, load basic data
      const [activeSeasonData, playersData] = await Promise.all([
        getActiveSeason(),
        getPlayers(),
      ]);

      setActiveSeason(activeSeasonData);
      setPlayers(playersData);

      let teamsData = teams;
      if (activeSeasonData && teams.length === 0) {
        teamsData = await getTeams(activeSeasonData.id);
        setTeams(teamsData);
      }

      const teamId = activeTeamId || teamsData[0]?.id;
      if (!teamId) {
        setIsLoading(false);
        return;
      }

      // Load team-specific data in parallel
      const [
        upcomingEventsData,
        allEventsData,
        teamPlayersData,
        formStreakData,
        practicePlansData,
      ] = await Promise.all([
        getUpcomingEvents(teamId),
        getEventsByTeam(teamId),
        getPlayersByTeam(teamId),
        getFormStreak(teamId).catch(() => ({ results: [], winRate: 0 })),
        getPracticePlansByTeam(teamId).catch(() => []),
      ]);

      setUpcomingEvents(upcomingEventsData.slice(0, 5));
      setTeamPlayers(teamPlayersData);
      setWinRate(formStreakData.winRate);

      // Find today's event
      const todaysEvent = allEventsData.find(event => {
        const eventDate = parseISO(event.start_time);
        return isToday(eventDate);
      });
      setTodayEvent(todaysEvent || null);

      // Get RSVP summary for today's event
      if (todaysEvent) {
        const rsvp = await getRSVPSummary(todaysEvent.id);
        setRsvpSummary({
          attending: rsvp.attending,
          not_attending: rsvp.not_attending,
          pending: rsvp.pending + rsvp.maybe,
        });
      }

      // Find next match (game or tournament)
      const nextMatchEvent = upcomingEventsData.find(
        event => event.type === 'game' || event.type === 'tournament'
      );
      setNextMatch(nextMatchEvent || null);

      // Find today's practice plan
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayPlan = practicePlansData.find(plan => plan.date === today);
      if (todayPlan) {
        setTodayPracticePlan({
          name: todayPlan.name,
          drillCount: 0, // Would need to fetch blocks to get this
          totalMinutes: 90, // Default
        });
      }

      // Calculate player attendance rates
      const playersAttendance: PlayerWithAttendance[] = await Promise.all(
        teamPlayersData.slice(0, 8).map(async (player) => {
          try {
            const attendanceRecords = await getPlayerAttendance(player.id);
            const recentRecords = attendanceRecords.slice(0, 10);
            const presentCount = recentRecords.filter(
              r => r.status === 'present' || r.status === 'late'
            ).length;
            const attendanceRate = recentRecords.length > 0
              ? Math.round((presentCount / recentRecords.length) * 100)
              : 100;

            const nameParts = player.name.split(' ');
            const initials = nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
              : player.name.substring(0, 2);

            return {
              id: player.id,
              name: player.name,
              initials: initials.toUpperCase(),
              position: getPositionAbbr(player.positions?.[0] || 'all_around'),
              attendance: attendanceRate,
              form: attendanceRate >= 70 ? 'good' as const : 'poor' as const,
            };
          } catch {
            const nameParts = player.name.split(' ');
            const initials = nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
              : player.name.substring(0, 2);
            return {
              id: player.id,
              name: player.name,
              initials: initials.toUpperCase(),
              position: getPositionAbbr(player.positions?.[0] || 'all_around'),
              attendance: 100,
              form: 'good' as const,
            };
          }
        })
      );

      setPlayersWithAttendance(playersAttendance);

      // Find player with low attendance for alert
      const lowAttendance = playersAttendance.find(p => p.attendance < 70);
      setLowAttendancePlayer(lowAttendance || null);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setActiveSeason, setPlayers, setTeams, teams, activeTeamId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate overall attendance rate
  const attendanceRate = useMemo(() => {
    if (playersWithAttendance.length === 0) return 0;
    const total = playersWithAttendance.reduce((sum, p) => sum + p.attendance, 0);
    return Math.round(total / playersWithAttendance.length);
  }, [playersWithAttendance]);

  // Sorted players for roster table
  const sortedPlayers = useMemo(() => {
    return [...playersWithAttendance].sort((a, b) => {
      return attendanceSortOrder === 'desc'
        ? b.attendance - a.attendance
        : a.attendance - b.attendance;
    });
  }, [playersWithAttendance, attendanceSortOrder]);

  // Calculate days until next match
  const daysUntilNextMatch = useMemo(() => {
    if (!nextMatch) return null;
    const matchDate = parseISO(nextMatch.start_time);
    return differenceInDays(matchDate, new Date());
  }, [nextMatch]);

  const togglePanel = useCallback((panel: ExpandedPanel) => {
    setExpandedPanel(prev => prev === panel ? null : panel);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  // Format upcoming events for ScheduleItem component
  const formattedUpcomingEvents = upcomingEvents.map(event => {
    const eventDate = parseISO(event.start_time);
    return {
      id: event.id,
      day: format(eventDate, 'dd'),
      month: format(eventDate, 'MMM'),
      title: event.type === 'game' && event.opponent ? `vs ${event.opponent}` : event.title,
      meta: `${event.location || 'TBD'}, ${format(eventDate, 'HH:mm')}`,
      type: (event.type === 'game' || event.type === 'tournament' ? 'match' : 'practice') as 'match' | 'practice',
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-wider text-white mb-1">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            {selectedTeam?.name || 'No Team Selected'} • Season {activeSeason?.name || 'N/A'}
          </p>
        </div>

        {/* Today's Practice/Event Hero Card */}
        {todayEvent ? (
          <div className="mb-8">
            <TodayEventCard
              title={todayEvent.type === 'game' && todayEvent.opponent
                ? `vs ${todayEvent.opponent}`
                : todayEvent.title}
              location={todayEvent.location || 'Location TBD'}
              time={`${format(parseISO(todayEvent.start_time), 'HH:mm')} - ${format(parseISO(todayEvent.end_time), 'HH:mm')}`}
              rsvpSummary={{
                coming: rsvpSummary.attending,
                notComing: rsvpSummary.not_attending,
                pending: rsvpSummary.pending,
              }}
              onViewDetails={() => navigate(`/events/${todayEvent.id}`)}
            />
          </div>
        ) : (
          <div className="mb-8 p-6 rounded-lg bg-navy-90 border border-white/[0.06] text-center">
            <p className="text-gray-400">No events scheduled for today</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/schedule')}
              className="mt-2 text-vq-teal hover:text-vq-teal"
            >
              View Schedule
            </Button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            delta={attendanceRate >= 80 ? 'Good standing' : 'Needs improvement'}
            deltaType={attendanceRate >= 80 ? 'positive' : 'negative'}
            accent="success"
            isActive={expandedPanel === 'attendance'}
            onClick={() => togglePanel('attendance')}
          />
          <StatCard
            label="Win Rate"
            value={`${winRate}%`}
            delta="Last 5 games"
            deltaType={winRate >= 50 ? 'positive' : 'neutral'}
            accent="primary"
            isActive={expandedPanel === 'winRate'}
            onClick={() => togglePanel('winRate')}
          />
          <StatCard
            label="Active Players"
            value={String(teamPlayers.length)}
            delta="On roster"
            deltaType="neutral"
            accent="secondary"
            isActive={expandedPanel === 'activePlayers'}
            onClick={() => togglePanel('activePlayers')}
          />
          <StatCard
            label="Next Match"
            value={daysUntilNextMatch !== null ? `${daysUntilNextMatch} days` : 'None'}
            delta={nextMatch?.opponent ? `vs ${nextMatch.opponent}` : 'No matches scheduled'}
            deltaType="neutral"
            accent="teal"
            isActive={expandedPanel === 'nextMatch'}
            onClick={() => togglePanel('nextMatch')}
          />
        </div>

        {/* Expansion Panels */}
        {selectedTeam && (
          <div className="mb-4">
            <ExpansionContainer isExpanded={expandedPanel === 'attendance'}>
              {expandedPanel === 'attendance' && (
                <AttendanceExpansionPanel teamId={selectedTeam.id} />
              )}
            </ExpansionContainer>
            <ExpansionContainer isExpanded={expandedPanel === 'winRate'}>
              {expandedPanel === 'winRate' && (
                <WinRateExpansionPanel teamId={selectedTeam.id} />
              )}
            </ExpansionContainer>
            <ExpansionContainer isExpanded={expandedPanel === 'activePlayers'}>
              {expandedPanel === 'activePlayers' && (
                <ActivePlayersExpansionPanel
                  teamPlayers={teamPlayers}
                  playersWithAttendance={playersWithAttendance}
                />
              )}
            </ExpansionContainer>
            <ExpansionContainer isExpanded={expandedPanel === 'nextMatch'}>
              {expandedPanel === 'nextMatch' && (
                <NextMatchExpansionPanel
                  nextMatch={nextMatch}
                  upcomingEvents={upcomingEvents}
                />
              )}
            </ExpansionContainer>
          </div>
        )}

        {/* Attendance Alert - Full Width */}
        {lowAttendancePlayer && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">
                <strong>{lowAttendancePlayer.name}</strong> has missed recent practices ({lowAttendancePlayer.attendance}% attendance). Consider reaching out.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/players/${lowAttendancePlayer.id}`)}
              className="text-vq-teal hover:text-vq-teal hover:bg-vq-teal/10"
            >
              View Player
            </Button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,380px] gap-6">
          {/* Left Column - Roster Overview Table */}
          <Card className="bg-navy-90 border-white/[0.06]">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
              <h2 className="font-display font-bold text-sm uppercase tracking-wide text-white">
                Roster Overview
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/players')}
                className="text-vq-teal hover:text-vq-teal hover:bg-vq-teal/10"
              >
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left text-xs font-display font-semibold uppercase tracking-wider text-gray-400 px-4 py-3">Player</th>
                    <th className="text-left text-xs font-display font-semibold uppercase tracking-wider text-gray-400 px-4 py-3">Pos</th>
                    <th
                      className="text-left text-xs font-display font-semibold uppercase tracking-wider text-gray-400 px-4 py-3 cursor-pointer hover:text-white transition-colors select-none"
                      onClick={() => setAttendanceSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Attendance
                        <span className="text-vq-teal">
                          {attendanceSortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      </span>
                    </th>
                    <th className="text-center text-xs font-display font-semibold uppercase tracking-wider text-gray-400 px-4 py-3">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.length > 0 ? (
                    sortedPlayers.slice(0, 6).map((player) => (
                      <tr
                        key={player.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              initials={player.initials}
                              position={player.position}
                              size="sm"
                            />
                            <span className="text-sm font-medium text-white">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 text-xs font-display font-semibold uppercase bg-navy-80 rounded text-gray-300">
                            {player.position}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-navy-70 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  player.attendance >= 90
                                    ? 'bg-green-500'
                                    : player.attendance >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${player.attendance}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 font-mono w-10">
                              {player.attendance}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className={`w-3 h-3 rounded-full mx-auto ${
                              player.form === 'good' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={`Form: ${player.form}`}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                        No players on roster
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right Column - Upcoming & Practice Plan */}
          <div className="space-y-6">
            {/* Upcoming Schedule */}
            <Card className="bg-navy-90 border-white/[0.06]">
              <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
                <h2 className="font-display font-bold text-sm uppercase tracking-wide text-white">
                  Upcoming
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/schedule')}
                  className="text-vq-teal hover:text-vq-teal hover:bg-vq-teal/10"
                >
                  View All
                </Button>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {formattedUpcomingEvents.length > 0 ? (
                    formattedUpcomingEvents.slice(0, 3).map((event) => (
                      <ScheduleItem
                        key={event.id}
                        day={event.day}
                        month={event.month}
                        title={event.title}
                        meta={event.meta}
                        type={event.type}
                        onClick={() => navigate(`/events/${event.id}`)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">No upcoming events</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Practice Plan Link */}
            {todayPracticePlan ? (
              <div
                className="flex items-center gap-4 p-4 rounded-lg bg-navy-90 border border-white/[0.06] cursor-pointer hover:border-vq-teal/40 transition-all"
                onClick={() => navigate('/practice-plans')}
              >
                <div className="w-10 h-10 rounded-lg bg-vq-teal/10 flex items-center justify-center text-xl">
                  📋
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-white">Today's Practice Plan</p>
                  <p className="text-xs text-gray-400">{todayPracticePlan.name} • {todayPracticePlan.drillCount} drills • {todayPracticePlan.totalMinutes} min</p>
                </div>
                <span className="text-vq-teal text-xl">→</span>
              </div>
            ) : todayEvent?.type === 'practice' ? (
              <div
                className="flex items-center gap-4 p-4 rounded-lg bg-navy-90 border border-white/[0.06] cursor-pointer hover:border-vq-teal/40 transition-all"
                onClick={() => navigate('/practice-plans')}
              >
                <div className="w-10 h-10 rounded-lg bg-vq-teal/10 flex items-center justify-center text-xl">
                  📋
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-sm text-white">Create Practice Plan</p>
                  <p className="text-xs text-gray-400">No plan for today's practice yet</p>
                </div>
                <span className="text-vq-teal text-xl">→</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* No Season/Team States */}
        {!activeSeason && (
          <Card className="mt-8 border-2 border-dashed border-club-primary/30 bg-club-primary/5">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{t('player.noActiveSeason')}</p>
              <Button onClick={() => navigate('/seasons')} className="shadow-lg">
                {t('season.addSeason')}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeSeason && teams.length === 0 && (
          <Card className="mt-8 border-2 border-dashed border-club-secondary/30 bg-club-secondary/5">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{t('team.noTeams')}</p>
              <Button onClick={() => navigate('/teams')} className="shadow-lg">
                {t('team.addTeam')}
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

/**
 * Get position abbreviation
 */
function getPositionAbbr(position: string): string {
  const positionMap: Record<string, string> = {
    setter: 'S',
    outside_hitter: 'OH',
    middle_blocker: 'MB',
    opposite: 'OPP',
    libero: 'L',
    defensive_specialist: 'DS',
    all_around: 'AA',
  };
  return positionMap[position] || position.substring(0, 2).toUpperCase();
}
