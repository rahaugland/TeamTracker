import { useTranslation } from 'react-i18next';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { FifaCardCompact } from '@/components/player-stats/FifaCardCompact';
import { GameLogCards } from '@/components/player-stats/GameLogCards';
import { PlayerAttendanceHistory } from '@/components/player/PlayerAttendanceHistory';
import type { VolleyballPosition } from '@/types/database.types';

export function PlayerStatsTabPage() {
  const { t } = useTranslation();
  const { player, teamIds, isLoading: playerLoading } = usePlayerContext();

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
  });

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
    <div className="max-w-lg mx-auto space-y-5">
      {/* FIFA Card Compact */}
      {rating && (
        <FifaCardCompact
          overallRating={rating.overallRating}
          subRatings={rating.subRatings}
          position={position}
          playerName={player.name}
          photoUrl={player.photo_url || undefined}
          isProvisional={rating.isProvisional}
          trendDirection={rating.trendDirection}
          trendDelta={rating.trendDelta}
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

      {/* Game Log */}
      {gameStatLines.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/50 mb-3">
            {t('player.stats.gameLog.title')}
          </h3>
          <GameLogCards games={gameStatLines.slice(0, 10)} />
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
