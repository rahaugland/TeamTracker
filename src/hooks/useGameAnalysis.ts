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
import type { DateRange } from '@/services/analytics.service';

export interface GameAnalysisData {
  gameStats: TeamGameStat[];
  tierAnalysis: OpponentTierAnalysis[];
  setAnalysis: SetScoreAnalysis | null;
  opponentHistory: OpponentHistory[];
}

export function useGameAnalysis(teamId: string | undefined, dateRange?: DateRange) {
  const [data, setData] = useState<GameAnalysisData>({
    gameStats: [],
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
    ]).then(([gameStats, tierAnalysis, setAnalysis, opponentHistory]) => {
      if (!cancelled) {
        // Filter to only played games (past) within date range
        const now = new Date().toISOString();
        let filteredGames = gameStats.filter((g) => g.date <= now);
        if (dateRange) {
          filteredGames = filteredGames.filter(
            (g) => g.date >= dateRange.startDate && g.date <= dateRange.endDate
          );
        }
        setData({ gameStats: filteredGames, tierAnalysis, setAnalysis, opponentHistory });
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
