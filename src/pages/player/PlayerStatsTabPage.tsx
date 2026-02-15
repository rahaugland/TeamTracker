import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { PendingMemberships } from '@/components/player/PendingMemberships';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { FifaCardCompact } from '@/components/player-stats/FifaCardCompact';
import { SkillBarEnhanced } from '@/components/player-stats/SkillBarEnhanced';
import { GameLogCards } from '@/components/player-stats/GameLogCards';
import { GameLogTable } from '@/components/player-stats/GameLogTable';
import { BarChart3 } from 'lucide-react';
import type { VolleyballPosition } from '@/types/database.types';
import type { TimePeriod } from '@/services/player-stats.service';

type PeriodFilter = 'last30' | 'season' | 'career';

/** Skill display configuration with gradient color keys */
const SKILL_CONFIG = [
  { key: 'serve',    label: 'Serve',    color: 'red' },
  { key: 'receive',  label: 'Receive',  color: 'teal' },
  { key: 'set',      label: 'Set',      color: 'gold' },
  { key: 'block',    label: 'Block',    color: 'purple' },
  { key: 'attack',   label: 'Attack',   color: 'red' },
  { key: 'dig',      label: 'Dig',      color: 'teal' },
  { key: 'mental',   label: 'Mental',   color: 'pink' },
  { key: 'physique', label: 'Physique', color: 'gold' },
] as const;

/** Stat card color classes keyed by stat name */
const STAT_COLORS: Record<string, string> = {
  games: 'text-teal-400',
  kills: 'text-amber-400',
  killPct: 'text-emerald-400',
  aces: 'text-red-400',
  passRating: 'text-teal-400',
  blocks: 'text-amber-400',
  digs: 'text-emerald-400',
  attendance: 'text-red-400',
};

export function PlayerStatsTabPage() {
  const { t } = useTranslation();
  const { player, teamIds, isLoading: playerLoading, hasActiveTeams, hasPendingTeams } = usePlayerContext();
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

  if (!player || (!hasActiveTeams && hasPendingTeams)) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-6">
        {player && hasPendingTeams ? (
          <PendingMemberships />
        ) : (
          <div className="text-center py-12 text-white/50">
            <p>{t('dashboard.player.noPlayerProfile')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto space-y-5">
      {/* Period Filter - 3 buttons */}
      <div className="flex gap-2">
        {(['last30', 'season', 'career'] as const).map((period) => {
          const labels: Record<PeriodFilter, string> = {
            last30: t('dashboard.filters.last30Days'),
            season: t('playerExperience.stats.periods.season'),
            career: t('playerExperience.stats.periods.career'),
          };
          return (
            <button
              key={period}
              type="button"
              onClick={() => setPeriodFilter(period)}
              className={`px-4 py-1.5 rounded-lg text-xs font-display font-semibold uppercase tracking-wider transition-colors ${
                periodFilter === period
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {labels[period]}
            </button>
          );
        })}
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

          {/* Skill Ratings Card */}
          {rating && (
            <div className="bg-navy-90 border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white mb-4">
                {t('playerExperience.skills.title')}
              </h3>
              <div className="space-y-2.5">
                {SKILL_CONFIG.map(({ key, label, color }) => (
                  <SkillBarEnhanced
                    key={key}
                    label={label}
                    value={rating.subRatings[key]}
                    color={color}
                  />
                ))}
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

      {/* Season Statistics with color-coded values */}
      {seasonStats && (
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('playerExperience.stats.seasonStatistics')}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SeasonStatCard value={String(seasonStats.gamesPlayed)} label={t('player.stats.gamesPlayed')} colorClass={STAT_COLORS.games} />
            <SeasonStatCard value={String(seasonStats.totalKills)} label={t('playerExperience.stats.totalKills')} colorClass={STAT_COLORS.kills} />
            <SeasonStatCard
              value={`${(seasonStats.killPercentage * 100).toFixed(1)}%`}
              label={t('playerExperience.stats.killPct')}
              colorClass={STAT_COLORS.killPct}
            />
            <SeasonStatCard value={String(seasonStats.totalAces)} label={t('playerExperience.stats.aces')} colorClass={STAT_COLORS.aces} />
            <SeasonStatCard
              value={seasonStats.passRating > 0 ? seasonStats.passRating.toFixed(2) : '-'}
              label={t('playerExperience.stats.passRating')}
              colorClass={STAT_COLORS.passRating}
            />
            <SeasonStatCard value={seasonStats.totalBlocks.toFixed(1)} label={t('playerExperience.stats.totalBlocks')} colorClass={STAT_COLORS.blocks} />
            <SeasonStatCard value={String(seasonStats.totalDigs)} label={t('playerExperience.stats.digs')} colorClass={STAT_COLORS.digs} />
            <SeasonStatCard
              value={seasonStats.attendanceRate != null ? `${seasonStats.attendanceRate}%` : '-'}
              label={t('playerExperience.stats.attendancePct')}
              colorClass={STAT_COLORS.attendance}
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
              value={`${Math.round(attendanceStats.attendanceRate * 100)}%`}
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

function SeasonStatCard({ value, label, colorClass }: { value: string; label: string; colorClass?: string }) {
  return (
    <div className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 text-center">
      <div className={`text-2xl font-mono font-bold ${colorClass || 'text-white'}`}>{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
