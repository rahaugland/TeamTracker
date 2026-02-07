import { useTranslation } from 'react-i18next';
import { Flame, BarChart3, Target, Trophy } from 'lucide-react';

interface QuickStatsGridProps {
  streak: number;
  attendanceRate: number;
  activeGoals: number;
  gamesPlayed: number;
}

export function QuickStatsGrid({ streak, attendanceRate, activeGoals, gamesPlayed }: QuickStatsGridProps) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Flame,
      value: streak,
      label: t('playerExperience.progress.currentStreak'),
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      icon: BarChart3,
      value: `${attendanceRate}%`,
      label: t('playerExperience.progress.attendancePct'),
      color: 'text-vq-teal',
      bgColor: 'bg-vq-teal/10',
    },
    {
      icon: Target,
      value: activeGoals,
      label: t('playerExperience.progress.activeGoals', { count: activeGoals }),
      color: 'text-club-primary',
      bgColor: 'bg-club-primary/10',
    },
    {
      icon: Trophy,
      value: gamesPlayed,
      label: t('player.stats.gamesPlayed'),
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-navy-90 border border-white/[0.04] rounded-xl p-4 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-white leading-tight">{stat.value}</div>
            <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-white/50 leading-tight truncate">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
