import { useState, useEffect } from 'react';
import {
  getPlayerStats,
  calculatePlayerRating,
  aggregateStats,
  getGameStatLines,
  getRotationStats,
  getAttendanceStats,
  type PlayerRating,
  type AggregatedStats,
  type GameStatLine,
  type RotationStats,
  type AttendanceStats,
} from '@/services/player-stats.service';
import type { DateRange } from '@/services/analytics.service';
import type { VolleyballPosition } from '@/types/database.types';

export interface PlayerComparisonData {
  rating: PlayerRating | null;
  aggregated: AggregatedStats | null;
  gameLines: GameStatLine[];
  rotationStats: RotationStats[];
  attendance: AttendanceStats | null;
}

export function usePlayerComparison(
  playerId: string | undefined,
  teamId: string,
  position: VolleyballPosition,
  dateRange?: DateRange
) {
  const [data, setData] = useState<PlayerComparisonData>({
    rating: null,
    aggregated: null,
    gameLines: [],
    rotationStats: [],
    attendance: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setData({ rating: null, aggregated: null, gameLines: [], rotationStats: [], attendance: null });
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const customRange = dateRange
      ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
      : undefined;

    Promise.all([
      getPlayerStats(playerId, dateRange ? 'custom' : 'career', customRange, teamId),
      getAttendanceStats(playerId, teamId),
    ]).then(([entries, attendance]) => {
      if (cancelled) return;

      const rating = entries.length > 0 ? calculatePlayerRating(entries, position) : null;
      const aggregated = entries.length > 0 ? aggregateStats(entries) : null;
      const gameLines = getGameStatLines(entries);
      const rotationStats = getRotationStats(entries);

      setData({ rating, aggregated, gameLines, rotationStats, attendance });
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [playerId, teamId, position, dateRange?.startDate, dateRange?.endDate]);

  return { ...data, isLoading };
}
