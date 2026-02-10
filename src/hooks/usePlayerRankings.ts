import { useState, useEffect } from 'react';
import {
  getTeamPlayerRankings,
  type PlayerRankingEntry,
} from '@/services/reports.service';
import { getPlayerAttendanceRates, type PlayerAttendanceRate, type DateRange } from '@/services/analytics.service';

export interface PlayerRankingsData {
  rankings: PlayerRankingEntry[];
  attendanceRates: PlayerAttendanceRate[];
}

export function usePlayerRankings(teamId: string | undefined, dateRange?: DateRange) {
  const [data, setData] = useState<PlayerRankingsData>({ rankings: [], attendanceRates: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getTeamPlayerRankings(teamId, dateRange).catch(() => []),
      getPlayerAttendanceRates(teamId, dateRange).catch(() => []),
    ]).then(([rankings, attendanceRates]) => {
      if (!cancelled) {
        setData({ rankings, attendanceRates });
        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load rankings');
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [teamId, dateRange?.startDate, dateRange?.endDate]);

  return { ...data, isLoading, error };
}
