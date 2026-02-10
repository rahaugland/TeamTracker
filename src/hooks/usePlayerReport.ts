import { useState, useEffect, useMemo } from 'react';
import {
  getPlayerStats,
  getAttendanceStats,
  calculatePlayerRating,
  aggregateStats,
  getGameStatLines,
  type StatEntryWithEvent,
  type PlayerRating,
  type AggregatedStats,
  type GameStatLine,
  type AttendanceStats,
} from '@/services/player-stats.service';
import type { VolleyballPosition } from '@/types/database.types';

export interface PlayerReportData {
  rating: PlayerRating | null;
  aggregated: AggregatedStats | null;
  gameStatLines: GameStatLine[];
  attendance: AttendanceStats | null;
  perGameRatings: Array<{ date: string; rating: number }>;
  isLoading: boolean;
  error: string | null;
}

export function usePlayerReport(
  playerId: string | undefined,
  teamId: string | undefined,
  position: VolleyballPosition,
  dateRange?: { startDate: string; endDate: string }
): PlayerReportData {
  const [statEntries, setStatEntries] = useState<StatEntryWithEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId || !teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getPlayerStats(playerId, 'career', undefined, teamId).catch(() => []),
      getAttendanceStats(playerId, teamId).catch(() => null),
    ]).then(([entries, att]) => {
      if (!cancelled) {
        setStatEntries(entries);
        setAttendance(att);
        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load player report');
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [playerId, teamId]);

  const rating = useMemo(
    () => (statEntries.length > 0 ? calculatePlayerRating(statEntries, position) : null),
    [statEntries, position]
  );

  const aggregated = useMemo(
    () => (statEntries.length > 0 ? aggregateStats(statEntries) : null),
    [statEntries]
  );

  const gameStatLines = useMemo(
    () => getGameStatLines(statEntries),
    [statEntries]
  );

  const perGameRatings = useMemo(() => {
    return [...statEntries]
      .filter((e) => e.event?.start_time)
      .sort((a, b) => a.event.start_time.localeCompare(b.event.start_time))
      .map((entry) => {
        const singleRating = calculatePlayerRating([entry], position);
        return {
          date: entry.event.start_time.substring(0, 10),
          rating: singleRating.overall,
        };
      });
  }, [statEntries, position]);

  return { rating, aggregated, gameStatLines, attendance, perGameRatings, isLoading, error };
}
