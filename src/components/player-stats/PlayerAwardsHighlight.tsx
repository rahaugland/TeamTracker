import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPlayerAwards } from '@/services/player-awards.service';
import type { PlayerAwardsSummary } from '@/services/player-awards.service';
import type { GameAwardType, SeasonAwardType } from '@/types/database.types';

interface PlayerAwardsHighlightProps {
  playerId: string;
  variant?: 'full' | 'compact';
}

const SEASON_AWARD_META: Record<SeasonAwardType, { icon: string; label: string; gradient: string }> = {
  season_mvp: { icon: '🏆', label: 'Season MVP', gradient: 'from-yellow-400 via-amber-500 to-yellow-600' },
  most_improved: { icon: '📈', label: 'Most Improved', gradient: 'from-purple-500 via-indigo-600 to-purple-700' },
  best_attendance: { icon: '✅', label: 'Best Attendance', gradient: 'from-green-500 via-emerald-600 to-green-700' },
  top_attacker: { icon: '⚡', label: 'Top Attacker', gradient: 'from-red-500 via-rose-600 to-red-700' },
  top_server: { icon: '🎯', label: 'Top Server', gradient: 'from-blue-500 via-cyan-600 to-blue-700' },
  top_defender: { icon: '🛡️', label: 'Top Defender', gradient: 'from-slate-500 via-zinc-600 to-slate-700' },
  top_passer: { icon: '🏐', label: 'Top Passer', gradient: 'from-teal-500 via-emerald-600 to-teal-700' },
  most_practices: { icon: '💪', label: 'Most Practices', gradient: 'from-orange-500 via-amber-600 to-orange-700' },
};

const GAME_AWARD_META: Record<GameAwardType, { icon: string; label: string; gradient: string }> = {
  mvp: { icon: '⭐', label: 'Match MVP', gradient: 'from-yellow-400 via-amber-500 to-yellow-600' },
  top_attacker: { icon: '⚡', label: 'Top Attacker', gradient: 'from-red-500 via-rose-600 to-red-700' },
  top_server: { icon: '🎯', label: 'Top Server', gradient: 'from-blue-500 via-cyan-600 to-blue-700' },
  top_defender: { icon: '🛡️', label: 'Top Defender', gradient: 'from-slate-500 via-zinc-600 to-slate-700' },
  top_passer: { icon: '🏐', label: 'Top Passer', gradient: 'from-teal-500 via-emerald-600 to-teal-700' },
};

interface HighlightItem {
  type: 'season' | 'game';
  awardType: string;
  icon: string;
  label: string;
  gradient: string;
  count: number;
  latestDate: string;
  context: string;
}

function buildHighlights(summary: PlayerAwardsSummary): HighlightItem[] {
  const items: HighlightItem[] = [];

  // Season awards first (higher priority)
  for (const [type, count] of Object.entries(summary.seasonAwardCounts)) {
    const meta = SEASON_AWARD_META[type as SeasonAwardType];
    if (!meta) continue;
    const latest = summary.seasonAwards.find(a => a.award_type === type);
    items.push({
      type: 'season',
      awardType: type,
      icon: meta.icon,
      label: meta.label,
      gradient: meta.gradient,
      count,
      latestDate: latest?.season_end || '',
      context: latest?.season_name || '',
    });
  }

  // Game awards
  for (const [type, count] of Object.entries(summary.gameAwardCounts)) {
    const meta = GAME_AWARD_META[type as GameAwardType];
    if (!meta) continue;
    const latest = summary.gameAwards.find(a => a.award_type === type);
    items.push({
      type: 'game',
      awardType: type,
      icon: meta.icon,
      label: meta.label,
      gradient: meta.gradient,
      count,
      latestDate: latest?.event_date || '',
      context: latest?.opponent ? `vs ${latest.opponent}` : latest?.event_title || '',
    });
  }

  // Sort: season awards first, then by count descending
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'season' ? -1 : 1;
    return b.count - a.count;
  });

  return items.slice(0, 5);
}

export function PlayerAwardsHighlight({ playerId, variant = 'full' }: PlayerAwardsHighlightProps) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PlayerAwardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPlayerAwards(playerId)
      .then(data => { if (!cancelled) setSummary(data); })
      .catch(err => console.error('Error loading awards:', err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [playerId]);

  if (isLoading) return null;
  if (!summary || summary.totalAwards === 0) return null;

  const highlights = buildHighlights(summary);
  if (highlights.length === 0) return null;

  // Compact variant - horizontal row with icons and counts
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-3 p-4 bg-gradient-to-br from-club-secondary/10 to-club-secondary/[0.02] border border-club-secondary/15 rounded-lg mb-6">
        {highlights.slice(0, 4).map((item) => (
          <div
            key={`${item.type}-${item.awardType}`}
            className="flex items-center gap-2 px-3 py-2 bg-club-secondary/10 rounded-md"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-display font-semibold text-xs uppercase tracking-wide text-club-secondary">
              {item.label}
              {item.count > 1 && ` x${item.count}`}
            </span>
          </div>
        ))}
        {summary.totalAwards > 4 && (
          <button
            onClick={() => navigate(`/players/${playerId}/stats#awards`)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-club-secondary hover:underline"
          >
            +{summary.totalAwards - 4} more
          </button>
        )}
      </div>
    );
  }

  // Full variant - cards with details
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Awards</h3>
        <button
          onClick={() => navigate(`/players/${playerId}/stats#awards`)}
          className="text-sm text-primary hover:underline"
        >
          See all {summary.totalAwards} awards
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {highlights.map((item) => (
          <div
            key={`${item.type}-${item.awardType}`}
            className={cn(
              'bg-gradient-to-br rounded-xl px-4 py-3 text-white min-w-[140px] relative overflow-hidden',
              item.gradient
            )}
          >
            {item.count > 1 && (
              <div className="absolute top-1.5 right-2 bg-white/25 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {item.count}x
              </div>
            )}
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-sm font-bold leading-tight">{item.label}</div>
            <div className="text-xs text-white/75 mt-1 truncate">{item.context}</div>
            <div className="text-xs text-white/60 mt-0.5">
              {item.latestDate ? new Date(item.latestDate).toLocaleDateString() : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
