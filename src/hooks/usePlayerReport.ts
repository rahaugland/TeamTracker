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

export interface PeriodDelta {
  killPct: number | null;
  acesPerGame: number | null;
  digsPerGame: number | null;
  passRating: number | null;
}

export interface PlayerReportData {
  rating: PlayerRating | null;
  aggregated: AggregatedStats | null;
  gameStatLines: GameStatLine[];
  attendance: AttendanceStats | null;
  perGameRatings: Array<{ date: string; rating: number }>;
  periodDelta: PeriodDelta;
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
  const [periodDelta, setPeriodDelta] = useState<PeriodDelta>({
    killPct: null, acesPerGame: null, digsPerGame: null, passRating: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId || !teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Calculate 1-month windows for period comparison
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const currentPeriodRange = {
      startDate: currentPeriodStart.toISOString(),
      endDate: now.toISOString(),
    };
    const previousPeriodRange = {
      startDate: previousPeriodStart.toISOString(),
      endDate: currentPeriodStart.toISOString(),
    };

    Promise.all([
      getPlayerStats(playerId, 'career', undefined, teamId).catch(() => []),
      getAttendanceStats(playerId, teamId).catch(() => null),
      getPlayerStats(playerId, 'custom', currentPeriodRange, teamId).catch(() => []),
      getPlayerStats(playerId, 'custom', previousPeriodRange, teamId).catch(() => []),
    ]).then(([entries, att, currentEntries, previousEntries]) => {
      if (cancelled) return;

      setStatEntries(entries);
      setAttendance(att);

      // Calculate period deltas (current month vs previous month)
      const curAgg = aggregateStats(currentEntries);
      const prevAgg = aggregateStats(previousEntries);

      const delta: PeriodDelta = {
        killPct: null,
        acesPerGame: null,
        digsPerGame: null,
        passRating: null,
      };

      if (curAgg.gamesPlayed > 0 && prevAgg.gamesPlayed > 0) {
        delta.killPct = Math.round((curAgg.killPercentage - prevAgg.killPercentage) * 1000) / 10;
        delta.acesPerGame = Math.round((curAgg.acesPerGame - prevAgg.acesPerGame) * 10) / 10;
        delta.digsPerGame = Math.round((curAgg.digsPerGame - prevAgg.digsPerGame) * 10) / 10;
        delta.passRating = Math.round((curAgg.passRating - prevAgg.passRating) * 100) / 100;
      }

      setPeriodDelta(delta);
      setIsLoading(false);
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
    const sorted = [...statEntries]
      .filter((e) => e.event?.start_time)
      .sort((a, b) => a.event.start_time.localeCompare(b.event.start_time));

    return sorted.map((entry, i) => {
      const gamesUpToNow = sorted.slice(0, i + 1);
      const cumulativeRating = calculatePlayerRating(gamesUpToNow, position);
      return {
        date: entry.event.start_time.substring(0, 10),
        rating: cumulativeRating.overall,
      };
    });
  }, [statEntries, position]);

  return { rating, aggregated, gameStatLines, attendance, perGameRatings, periodDelta, isLoading, error };
}
