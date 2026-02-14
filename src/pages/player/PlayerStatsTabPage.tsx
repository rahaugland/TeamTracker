import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { FifaCardCompact } from '@/components/player-stats/FifaCardCompact';
import { GameLogCards } from '@/components/player-stats/GameLogCards';
import { GameLogTable } from '@/components/player-stats/GameLogTable';
import { BarChart3 } from 'lucide-react';
import type { VolleyballPosition } from '@/types/database.types';
import type { TimePeriod } from '@/services/player-stats.service';

type PeriodFilter = 'season' | 'career';

export function PlayerStatsTabPage() {
  const { t } = useTranslation();
  const { player, teamIds, isLoading: playerLoading } = usePlayerContext();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('season');

  const position: VolleyballPosition = player?.positions?.[0] || 'all_around';

  const {
    isLoading,
    isLoadingAttendance,
    rating,
    gameStatLines,
    attendanceStats,
    playerForm,
  } = usePlayerStats({
    playerId: player?.id || '',
    position,
    teamId: teamIds[0],
    period: periodFilter as TimePeriod,
  });

  // Compute season statistics from aggregatedStats
  const seasonStats = useMemo(() => {
    if (!rating?.aggregatedStats) return null;
    const agg = rating.aggregatedStats;
    const totalBlocks = agg.totalBlockSolos + agg.totalBlockAssists * 0.5;
    return {
      gamesPlayed: agg.gamesPlayed,
      totalKills: agg.totalKills,
      killPercentage: agg.killPercentage,
      totalAces: agg.totalAces,
      passRating: agg.passRating,
      totalBlocks,
      totalDigs: agg.totalDigs,
      attendanceRate: attendanceStats
        ? Math.round(attendanceStats.attendanceRate * 100)
        : null,
    };
  }, [rating, attendanceStats]);

  if (playerLoading || (isLoading && !rating)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>{t('dashboard.player.noPlayerProfile')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto space-y-5">
      {/* Period Filter */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPeriodFilter('season')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            periodFilter === 'season'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Season
        </button>
        <button
          type="button"
          onClick={() => setPeriodFilter('career')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            periodFilter === 'career'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Career
        </button>
      </div>

      {/* Two-column grid on desktop: FIFA Card + Skills | Rating Progression placeholder */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Left column: FIFA Card + Skill Bars */}
        <div className="space-y-5">
          {/* FIFA Card Compact */}
          {rating && (
            <FifaCardCompact
              overallRating={rating.overall}
              subRatings={rating.subRatings}
              position={position}
              playerName={player.name}
              photoUrl={player.photo_url || undefined}
              isProvisional={rating.isProvisional}
            />
          )}

          {/* Skill Bars */}
          {rating && (
            <div className="space-y-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50">
                {t('player.stats.subRatings')}
              </h3>
              <div className="space-y-2">
                <SkillBar label={t('player.stats.attack')} value={rating.subRatings.attack} />
                <SkillBar label={t('player.stats.serve')} value={rating.subRatings.serve} />
                <SkillBar label={t('player.stats.reception')} value={rating.subRatings.reception} />
                <SkillBar label={t('player.stats.consistency')} value={rating.subRatings.consistency} />
              </div>
            </div>
          )}
        </div>

        {/* Right column: Rating Progression placeholder (desktop only) */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-navy-90 border border-white/[0.04] rounded-xl p-8 mt-5 lg:mt-0">
          <BarChart3 className="h-12 w-12 text-white/20 mb-3" />
          <p className="text-sm text-white/40 font-medium">Chart coming soon</p>
          <p className="text-xs text-white/25 mt-1">Rating Progression</p>
        </div>
      </div>

      {/* Form badge */}
      {playerForm && (
        <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-white/50">
              {t('stats.form')}
            </p>
            <p className="text-2xl font-bold text-white">{playerForm.formRating}</p>
          </div>
          <p className="text-xs text-white/50">
            {playerForm.practicesAttended}/{playerForm.practicesTotal} {t('player.stats.trends.practices')}
          </p>
        </div>
      )}

      {/* Season Statistics */}
      {seasonStats && (
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {periodFilter === 'season' ? 'Season' : 'Career'} Statistics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SeasonStatCard value={String(seasonStats.gamesPlayed)} label="Games Played" />
            <SeasonStatCard value={String(seasonStats.totalKills)} label="Total Kills" />
            <SeasonStatCard
              value={`${(seasonStats.killPercentage * 100).toFixed(1)}%`}
              label="Kill %"
            />
            <SeasonStatCard value={String(seasonStats.totalAces)} label="Aces" />
            <SeasonStatCard
              value={seasonStats.passRating > 0 ? seasonStats.passRating.toFixed(2) : '-'}
              label="Pass Rating"
            />
            <SeasonStatCard value={seasonStats.totalBlocks.toFixed(1)} label="Total Blocks" />
            <SeasonStatCard value={String(seasonStats.totalDigs)} label="Digs" />
            <SeasonStatCard
              value={seasonStats.attendanceRate != null ? `${seasonStats.attendanceRate}%` : '-'}
              label="Attendance %"
            />
          </div>
        </div>
      )}

      {/* Game Log */}
      {gameStatLines.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('player.stats.gameLog.title')}
          </h3>
          {/* Desktop: sortable table */}
          <div className="hidden lg:block">
            <GameLogTable gameStats={gameStatLines} position={position} />
          </div>
          {/* Mobile: card layout */}
          <div className="lg:hidden">
            <GameLogCards games={gameStatLines.slice(0, 10)} />
          </div>
        </div>
      )}

      {/* Attendance */}
      {attendanceStats && !isLoadingAttendance && (
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('player.attendance')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              value={`${attendanceStats.attendanceRate}%`}
              label={t('player.stats.attendance.attendanceRate')}
            />
            <StatCard
              value={String(attendanceStats.currentStreak)}
              label={t('player.stats.attendance.currentStreak')}
            />
            <StatCard
              value={String(attendanceStats.longestStreak)}
              label={t('player.stats.attendance.longestStreak')}
            />
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!rating && !isLoading && (
        <div className="text-center py-12 text-white/50">
          <p>{t('player.stats.noData')}</p>
        </div>
      )}
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-16 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-club-primary rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{value}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-white/50">
        {label}
      </div>
    </div>
  );
}

function SeasonStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
