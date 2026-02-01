import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getPlayerAwards } from '@/services/player-awards.service';
import type { PlayerAwardsSummary, PlayerGameAward, PlayerSeasonAward } from '@/services/player-awards.service';
import type { GameAwardType, SeasonAwardType } from '@/types/database.types';

interface PlayerAwardsShowcaseProps {
  playerId: string;
}

const SEASON_AWARD_META: Record<SeasonAwardType, { icon: string; label: string; gradient: string }> = {
  season_mvp: { icon: '\u{1F3C6}', label: 'Season MVP', gradient: 'from-yellow-400 via-amber-500 to-yellow-600' },
  most_improved: { icon: '\u{1F4C8}', label: 'Most Improved', gradient: 'from-purple-500 via-indigo-600 to-purple-700' },
  best_attendance: { icon: '\u2705', label: 'Best Attendance', gradient: 'from-green-500 via-emerald-600 to-green-700' },
  top_attacker: { icon: '\u26A1', label: 'Top Attacker', gradient: 'from-red-500 via-rose-600 to-red-700' },
  top_server: { icon: '\u{1F3AF}', label: 'Top Server', gradient: 'from-blue-500 via-cyan-600 to-blue-700' },
  top_defender: { icon: '\u{1F6E1}\uFE0F', label: 'Top Defender', gradient: 'from-slate-500 via-zinc-600 to-slate-700' },
  top_passer: { icon: '\u{1F3D0}', label: 'Top Passer', gradient: 'from-teal-500 via-emerald-600 to-teal-700' },
  most_practices: { icon: '\u{1F4AA}', label: 'Most Practices', gradient: 'from-orange-500 via-amber-600 to-orange-700' },
};

const GAME_AWARD_META: Record<GameAwardType, { icon: string; label: string; gradient: string }> = {
  mvp: { icon: '\u2B50', label: 'Match MVP', gradient: 'from-yellow-400 via-amber-500 to-yellow-600' },
  top_attacker: { icon: '\u26A1', label: 'Top Attacker', gradient: 'from-red-500 via-rose-600 to-red-700' },
  top_server: { icon: '\u{1F3AF}', label: 'Top Server', gradient: 'from-blue-500 via-cyan-600 to-blue-700' },
  top_defender: { icon: '\u{1F6E1}\uFE0F', label: 'Top Defender', gradient: 'from-slate-500 via-zinc-600 to-slate-700' },
  top_passer: { icon: '\u{1F3D0}', label: 'Top Passer', gradient: 'from-teal-500 via-emerald-600 to-teal-700' },
};

export function PlayerAwardsShowcase({ playerId }: PlayerAwardsShowcaseProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<PlayerAwardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPlayerAwards(playerId)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((err) => console.error('Error loading awards:', err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [playerId]);

  if (isLoading) return null;

  if (!summary || summary.totalAwards === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('playerExperience.progress.awardsTitle')}</h3>
        <div className="border border-dashed rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.progress.awardsEmpty')}
          </p>
        </div>
      </div>
    );
  }

  // Group season awards by type
  const seasonGroups = new Map<SeasonAwardType, PlayerSeasonAward[]>();
  for (const award of summary.seasonAwards) {
    const list = seasonGroups.get(award.award_type) || [];
    list.push(award);
    seasonGroups.set(award.award_type, list);
  }

  // Group game awards by type
  const gameGroups = new Map<GameAwardType, PlayerGameAward[]>();
  for (const award of summary.gameAwards) {
    const list = gameGroups.get(award.award_type) || [];
    list.push(award);
    gameGroups.set(award.award_type, list);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{t('playerExperience.progress.awardsTitle')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from(seasonGroups.entries()).map(([type, awards]) => {
          const meta = SEASON_AWARD_META[type];
          if (!meta) return null;
          return (
            <div key={`season-${type}`} className="rounded-xl overflow-hidden border">
              <div className={cn('bg-gradient-to-br p-3 text-white', meta.gradient)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{meta.icon}</span>
                  {awards.length > 1 && (
                    <span className="bg-white/25 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold">
                      {awards.length}x
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm">{meta.label}</div>
              </div>
              <div className="p-2 bg-card">
                <p className="text-xs text-muted-foreground truncate">
                  {awards[0].season_name}
                </p>
              </div>
            </div>
          );
        })}
        {Array.from(gameGroups.entries()).map(([type, awards]) => {
          const meta = GAME_AWARD_META[type];
          if (!meta) return null;
          return (
            <div key={`game-${type}`} className="rounded-xl overflow-hidden border">
              <div className={cn('bg-gradient-to-br p-3 text-white', meta.gradient)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="bg-white/25 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold">
                    {awards.length}x
                  </span>
                </div>
                <div className="font-bold text-sm">{meta.label}</div>
              </div>
              <div className="p-2 bg-card">
                <p className="text-xs text-muted-foreground truncate">
                  {awards[0].opponent ? `vs ${awards[0].opponent}` : awards[0].event_title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
