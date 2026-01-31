import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlayerAwards } from '@/services/player-awards.service';
import type { PlayerAwardsSummary, PlayerGameAward, PlayerSeasonAward } from '@/services/player-awards.service';
import type { GameAwardType, SeasonAwardType } from '@/types/database.types';

interface PlayerTrophyCaseProps {
  playerId: string;
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

function formatAwardValue(type: string, value?: number): string {
  if (value == null) return '';
  if (type === 'top_attacker' || type === 'best_attendance' || type === 'top_server') return `${value}%`;
  if (type === 'top_passer' || type === 'top_defender') return `${value}`;
  if (type === 'most_practices') return `${value} practices`;
  return `${value}`;
}

export function PlayerTrophyCase({ playerId }: PlayerTrophyCaseProps) {
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading awards...
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalAwards === 0) {
    return null;
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
    <div id="awards" className="scroll-mt-8">
      <h2 className="text-2xl font-bold mb-4">Trophy Case</h2>

      {/* Season Awards */}
      {seasonGroups.size > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Season Awards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(seasonGroups.entries()).map(([type, awards]) => {
                const meta = SEASON_AWARD_META[type];
                if (!meta) return null;
                return (
                  <div key={type} className="rounded-xl overflow-hidden border">
                    <div className={cn('bg-gradient-to-br p-4 text-white', meta.gradient)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">{meta.icon}</span>
                        {awards.length > 1 && (
                          <span className="bg-white/25 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-sm font-bold">
                            {awards.length}x
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-lg">{meta.label}</div>
                    </div>
                    <div className="p-3 space-y-2 bg-card">
                      {awards.map((award) => (
                        <div key={award.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{award.season_name}</span>
                          <div className="text-right">
                            {award.award_value != null && (
                              <span className="font-medium">
                                {formatAwardValue(type, award.award_value)}
                              </span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {new Date(award.season_end).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Awards */}
      {gameGroups.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Match Awards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(gameGroups.entries()).map(([type, awards]) => {
                const meta = GAME_AWARD_META[type];
                if (!meta) return null;
                return (
                  <div key={type} className="rounded-xl overflow-hidden border">
                    <div className={cn('bg-gradient-to-br p-4 text-white', meta.gradient)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">{meta.icon}</span>
                        <span className="bg-white/25 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-sm font-bold">
                          {awards.length}x
                        </span>
                      </div>
                      <div className="font-bold text-lg">{meta.label}</div>
                    </div>
                    <div className="p-3 space-y-2 bg-card max-h-48 overflow-y-auto">
                      {awards.slice(0, 10).map((award) => (
                        <div key={award.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">
                            {award.opponent ? `vs ${award.opponent}` : award.event_title}
                          </span>
                          <div className="text-right shrink-0">
                            {award.award_value != null && (
                              <span className="font-medium">
                                {formatAwardValue(type, award.award_value)}
                              </span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {new Date(award.event_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {awards.length > 10 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          + {awards.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
