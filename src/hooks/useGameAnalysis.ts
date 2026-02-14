import { useState, useEffect } from 'react';
import {
  getPerformanceByOpponentTier,
  getSetScoreAnalysis,
  getOpponentHistory,
  type OpponentTierAnalysis,
  type SetScoreAnalysis,
  type OpponentHistory,
} from '@/services/reports.service';
import { getTeamGameStats, type TeamGameStat } from '@/services/team-stats.service';
import { getUpcomingEvents } from '@/services/events.service';
import { supabase } from '@/lib/supabase';
import type { DateRange } from '@/services/analytics.service';
import type { Event } from '@/types/database.types';

export interface MvpInfo {
  playerName: string;
  stat: string;
}

export interface GameAnalysisData {
  gameStats: TeamGameStat[];
  upcomingGames: Event[];
  mvpMap: Map<string, MvpInfo>;
  tierAnalysis: OpponentTierAnalysis[];
  setAnalysis: SetScoreAnalysis | null;
  opponentHistory: OpponentHistory[];
}

export function useGameAnalysis(teamId: string | undefined, dateRange?: DateRange) {
  const [data, setData] = useState<GameAnalysisData>({
    gameStats: [],
    upcomingGames: [],
    mvpMap: new Map(),
    tierAnalysis: [],
    setAnalysis: null,
    opponentHistory: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getTeamGameStats(teamId).catch(() => []),
      getPerformanceByOpponentTier(teamId, dateRange).catch(() => []),
      getSetScoreAnalysis(teamId, dateRange).catch(() => null),
      getOpponentHistory(teamId, dateRange).catch(() => []),
      getUpcomingEvents(teamId).catch(() => []),
    ]).then(async ([gameStats, tierAnalysis, setAnalysis, opponentHistory, allUpcoming]) => {
      if (cancelled) return;

      // Filter upcoming to games/tournaments only
      const upcomingGames = allUpcoming.filter(
        (e: Event) => e.type === 'game' || e.type === 'tournament'
      );

      // Filter to only played games (past) within date range
      const now = new Date().toISOString();
      let filteredGames = gameStats.filter((g) => g.date <= now);
      if (dateRange) {
        filteredGames = filteredGames.filter(
          (g) => g.date >= dateRange.startDate && g.date <= dateRange.endDate
        );
      }

      // Batch fetch MVP awards for completed games
      const mvpMap = new Map<string, MvpInfo>();
      if (filteredGames.length > 0) {
        const eventIds = filteredGames.map((g) => g.eventId);
        try {
          const { data: mvpAwards } = await supabase
            .from('game_awards')
            .select('event_id, player_id, award_value')
            .in('event_id', eventIds)
            .eq('award_type', 'mvp');

          if (mvpAwards && mvpAwards.length > 0) {
            // Get player names for MVPs
            const playerIds = [...new Set(mvpAwards.map((a) => a.player_id))];
            const { data: players } = await supabase
              .from('players')
              .select('id, name')
              .in('id', playerIds);

            const playerNameMap = new Map<string, string>();
            for (const p of players || []) {
              playerNameMap.set(p.id, p.name);
            }

            for (const award of mvpAwards) {
              const name = playerNameMap.get(award.player_id) || 'Unknown';
              mvpMap.set(award.event_id, {
                playerName: name,
                stat: award.award_value != null ? String(Math.round(Number(award.award_value) * 10) / 10) : '',
              });
            }
          }
        } catch {
          // MVP data is optional, continue without it
        }
      }

      if (!cancelled) {
        setData({ gameStats: filteredGames, upcomingGames, mvpMap, tierAnalysis, setAnalysis, opponentHistory });
        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load game analysis');
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [teamId, dateRange?.startDate, dateRange?.endDate]);

  return { ...data, isLoading, error };
}
