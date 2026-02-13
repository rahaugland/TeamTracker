import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { FifaCard } from '@/components/player-stats/FifaCard';
import { PlayerTrendPanel } from '@/components/player-stats/PlayerTrendPanel';
import { StatSummaryRow } from '@/components/player-stats/StatSummaryRow';
import { AttackTrendChart } from '@/components/player-stats/AttackTrendChart';
import { ServeTrendChart } from '@/components/player-stats/ServeTrendChart';
import { DefenseTrendChart } from '@/components/player-stats/DefenseTrendChart';
import { GameLogTable } from '@/components/player-stats/GameLogTable';
import { AttendanceStreakCard } from '@/components/player-stats/AttendanceStreakCard';
import { EventTypeBreakdown } from '@/components/player-stats/EventTypeBreakdown';
import { MissedEventsTimeline } from '@/components/player-stats/MissedEventsTimeline';
import { DrillCountBySkill } from '@/components/player-stats/DrillCountBySkill';
import { SkillProgressionChart } from '@/components/player-stats/SkillProgressionChart';
import { TrainingVolumeChart } from '@/components/player-stats/TrainingVolumeChart';
import { PlayerTrophyCase } from '@/components/player-stats/PlayerTrophyCase';
import type { TimePeriod, CustomDateRange } from '@/services/player-stats.service';
import type { VolleyballPosition } from '@/types/database.types';
import { getPlayer } from '@/services/players.service';
import { useEffect } from 'react';
import { useAuth } from '@/store';

/**
 * FIFA-Style Player Stats Page
 * Comprehensive stats page with card, charts, and detailed breakdowns
 * Players can only view their own stats; coaches can view any player's stats.
 */
export function PlayerStatsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [period, setPeriod] = useState<TimePeriod>('career');
  const [customRange, setCustomRange] = useState<CustomDateRange>();
  const [playerName, setPlayerName] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<VolleyballPosition>('outside_hitter');
  const [playerPhotoUrl, setPlayerPhotoUrl] = useState<string>();

  // Load player basic info and enforce access control
  useEffect(() => {
    if (id) {
      getPlayer(id).then(player => {
        if (player) {
          // Players can only view their own stats
          if (user?.role === 'player' && player.user_id !== user?.id) {
            navigate('/player-dashboard', { replace: true });
            return;
          }
          setPlayerName(player.name);
          setPlayerPosition(player.positions[0] || 'outside_hitter');
          setPlayerPhotoUrl(player.photo_url);
        }
      }).catch(error => {
        console.error('Error loading player:', error);
      });
    }
  }, [id, user?.id, user?.role, navigate]);

  const {
    isLoading,
    isLoadingAttendance,
    isLoadingDrills,
    error,
    rating,
    gameStatLines,
    attendanceStats,
    eventTypeBreakdown,
    missedEvents,
    drillParticipation,
    skillProgression,
    trainingVolume,
    playerForm,
  } = usePlayerStats({
    playerId: id || '',
    position: playerPosition,
    period,
    customRange,
  });

  const handlePeriodChange = (newPeriod: TimePeriod, newCustomRange?: CustomDateRange) => {
    setPeriod(newPeriod);
    setCustomRange(newCustomRange);
  };

  // Calculate overall trend (last 5 games vs previous 5 games) for the FIFA card badge
  const overallTrend = useMemo(() => {
    if (gameStatLines.length < 2) return { direction: 'stable' as const, delta: 0 };

    const recent = gameStatLines.slice(0, Math.min(5, gameStatLines.length));
    const previous = gameStatLines.slice(5, Math.min(10, gameStatLines.length));
    if (previous.length === 0) return { direction: 'stable' as const, delta: 0 };

    const avg = (games: typeof recent, fn: (g: typeof recent[0]) => number) =>
      games.reduce((s, g) => s + fn(g), 0) / games.length;

    const recentScore = avg(recent, g => g.killPercentage) + avg(recent, g => g.servePercentage) + avg(recent, g => g.passRating) / 3;
    const previousScore = avg(previous, g => g.killPercentage) + avg(previous, g => g.servePercentage) + avg(previous, g => g.passRating) / 3;

    // Scale delta to a roughly 1-99 range for display (multiply by ~50 to make it readable)
    const rawDelta = recentScore - previousScore;
    const scaledDelta = rawDelta * 50;
    const threshold = 2; // minimum delta to show a trend

    if (Math.abs(scaledDelta) < threshold) return { direction: 'stable' as const, delta: 0 };
    return {
      direction: scaledDelta > 0 ? 'up' as const : 'down' as const,
      delta: scaledDelta,
    };
  }, [gameStatLines]);

  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Player ID not found</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 mb-6 text-sm">
          <Link to="/coach-dashboard" className="text-gray-400 hover:text-vq-teal transition-colors">
            Dashboard
          </Link>
          <span className="text-gray-500">/</span>
          <Link to="/players" className="text-gray-400 hover:text-vq-teal transition-colors">
            Players
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-white">Stats</span>
        </nav>
        <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-8 text-center">
          <p className="text-club-primary">Error loading stats: {error.message}</p>
          <Button
            variant="outline"
            onClick={() => navigate(`/players/${id}`)}
            className="mt-4 border-white/20 text-white hover:bg-white/5"
          >
            {t('common.buttons.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/coach-dashboard" className="text-gray-400 hover:text-vq-teal transition-colors">
          Dashboard
        </Link>
        <span className="text-gray-500">/</span>
        <Link to="/players" className="text-gray-400 hover:text-vq-teal transition-colors">
          Players
        </Link>
        <span className="text-gray-500">/</span>
        <span className="text-white">{playerName || 'Player Stats'}</span>
      </nav>

      {/* Hero Section: FIFA Card + Player Info Panel */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* FIFA Card */}
        <div className="flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96 w-full max-w-md bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">{t('common.messages.loading')}</p>
            </div>
          ) : rating ? (
            <FifaCard
              overallRating={rating.overall}
              subRatings={rating.subRatings}
              position={playerPosition}
              playerName={playerName}
              photoUrl={playerPhotoUrl}
              gamesPlayed={rating.gamesPlayed}
              formRating={playerForm?.formRating}
              formPractices={playerForm ? { attended: playerForm.practicesAttended, total: playerForm.practicesTotal } : undefined}
              isProvisional={rating.isProvisional}
              trendDirection={overallTrend.direction}
              trendDelta={overallTrend.delta}
            />
          ) : (
            <div className="flex items-center justify-center h-96 w-full max-w-md bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">No stats available for this period</p>
            </div>
          )}
        </div>

        {/* Player Info Panel */}
        <div className="flex-1">
          <h1 className="font-display font-extrabold text-5xl uppercase leading-none mb-3">
            {playerName}
          </h1>
          <div className="flex items-center gap-4 mb-6 text-muted-foreground text-sm">
            <span>{getPositionName(playerPosition)}</span>
            <span>•</span>
            <span>{rating?.gamesPlayed || 0} Games Played</span>
          </div>

          {/* Quick Stats Grid */}
          {!isLoading && rating && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-navy-90 border border-white/10 rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-3xl mb-1 text-emerald-400">
                  {attendanceStats ? Math.round(attendanceStats.attendanceRate * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendance</p>
              </div>
              <div className="bg-navy-90 border border-white/10 rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-3xl mb-1">
                  {rating.aggregatedStats.totalKills}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Kills</p>
              </div>
              <div className="bg-navy-90 border border-white/10 rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-3xl mb-1">
                  {rating.aggregatedStats.totalAces}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Aces</p>
              </div>
              <div className="bg-navy-90 border border-white/10 rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-3xl mb-1">
                  {rating.aggregatedStats.totalBlockSolos + rating.aggregatedStats.totalBlockAssists}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Blocks</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        <button className="px-4 py-2 text-sm font-medium border-b-2 border-club-primary text-white">
          Overview
        </button>
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white">
          Stats History
        </button>
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white">
          Attendance
        </button>
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white">
          Notes
        </button>
      </div>

      {/* Performance Trends and Recent Games - Two Column Layout */}
      {!isLoading && gameStatLines.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <PlayerTrendPanel
              gameStatLines={gameStatLines}
              playerForm={playerForm}
              aggregatedStats={rating?.aggregatedStats || null}
              period={period}
              customRange={customRange}
              onPeriodChange={handlePeriodChange}
              isLoading={isLoading}
            />
          </div>
          <div>
            <GameLogTable gameStats={gameStatLines} position={playerPosition} />
          </div>
        </div>
      )}

      {/* Stat Summary Row */}
      {!isLoading && rating && (
        <div className="mb-8">
          <StatSummaryRow
            aggregatedStats={rating.aggregatedStats}
            gameStats={gameStatLines}
          />
        </div>
      )}

      {/* Trophy Case */}
      {!isLoading && id && (
        <div className="mb-8">
          <PlayerTrophyCase playerId={id} />
        </div>
      )}

      {/* Performance Charts */}
      {!isLoading && gameStatLines.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Performance Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AttackTrendChart gameStats={gameStatLines} />
            <ServeTrendChart gameStats={gameStatLines} />
          </div>
          <div className="mb-6">
            <DefenseTrendChart gameStats={gameStatLines} />
          </div>
        </div>
      )}

      {/* Attendance Section */}
      {!isLoadingAttendance && attendanceStats && attendanceStats.totalEvents > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Attendance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AttendanceStreakCard stats={attendanceStats} />
            {eventTypeBreakdown && <EventTypeBreakdown breakdown={eventTypeBreakdown} />}
          </div>
          <div>
            <MissedEventsTimeline events={missedEvents} />
          </div>
        </div>
      )}

      {/* Drill Participation Section */}
      {!isLoadingDrills && drillParticipation.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Drill Participation</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DrillCountBySkill participation={drillParticipation} />
            <SkillProgressionChart progression={skillProgression} />
          </div>
          <div>
            <TrainingVolumeChart volume={trainingVolume} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !rating && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No stats recorded yet. Stats will appear once games are played and recorded.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to get position name
function getPositionName(position: VolleyballPosition): string {
  const names: Record<VolleyballPosition, string> = {
    setter: 'Setter',
    outside_hitter: 'Outside Hitter',
    middle_blocker: 'Middle Blocker',
    opposite: 'Opposite',
    libero: 'Libero',
    defensive_specialist: 'Defensive Specialist',
    all_around: 'All Around',
  };
  return names[position];
}
