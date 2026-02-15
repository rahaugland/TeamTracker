import { useTranslation } from 'react-i18next';
import { ColorStatCard } from '@/components/ui/color-stat-card';

interface QuickStatsGridProps {
  streak: number;
  attendanceRate: number;
  activeGoals: number;
  gamesPlayed: number;
  totalEvents?: number;
  completedGoals?: number;
}

export function QuickStatsGrid({
  streak,
  attendanceRate,
  activeGoals,
  gamesPlayed,
  totalEvents,
  completedGoals,
}: QuickStatsGridProps) {
  const { t } = useTranslation();

  const presentCount = totalEvents != null
    ? Math.round((attendanceRate / 100) * totalEvents)
    : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <ColorStatCard
        value={streak}
        label={t('playerExperience.progress.currentStreak')}
        color="red"
        highlight={streak > 5}
        subtitle={streak > 5 ? t('playerExperience.progress.bestStreak', { count: streak }) : undefined}
      />
      <ColorStatCard
        value={`${attendanceRate}%`}
        label={t('playerExperience.progress.attendancePct')}
        color="green"
        subtitle={presentCount != null && totalEvents != null ? `${presentCount}/${totalEvents} ${t('dashboard.widgets.events')}` : undefined}
      />
      <ColorStatCard
        value={activeGoals}
        label={t('playerExperience.progress.activeGoals', { count: activeGoals })}
        color="gold"
        subtitle={completedGoals != null ? t('goals.completedGoals', { count: completedGoals }) : undefined}
      />
      <ColorStatCard
        value={gamesPlayed}
        label={t('player.stats.gamesPlayed')}
        color="teal"
        subtitle={t('playerExperience.stats.periods.season')}
      />
    </div>
  );
}
