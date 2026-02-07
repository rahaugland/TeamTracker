import { useState, useEffect } from 'react';
import {
  getPlayerStats,
  calculatePlayerRating,
  getGameStatLines,
  getAttendanceStats,
  getEventTypeBreakdown,
  getMissedEventsTimeline,
  getDrillParticipation,
  getSkillProgression,
  getTrainingVolume,
  getPlayerForm,
  type StatEntryWithEvent,
  type PlayerRating,
  type GameStatLine,
  type AttendanceStats,
  type EventTypeBreakdown,
  type MissedEvent,
  type DrillParticipation,
  type SkillProgressionPoint,
  type TrainingVolumePoint,
  type TimePeriod,
  type CustomDateRange,
  type PlayerForm,
} from '@/services/player-stats.service';
import type { VolleyballPosition } from '@/types/database.types';

interface UsePlayerStatsOptions {
  playerId: string;
  position: VolleyballPosition;
  period?: TimePeriod;
  customRange?: CustomDateRange;
  teamId?: string;
  seasonId?: string;
}

interface UsePlayerStatsReturn {
  // Loading states
  isLoading: boolean;
  isLoadingAttendance: boolean;
  isLoadingDrills: boolean;

  // Error states
  error: Error | null;
  attendanceError: Error | null;
  drillsError: Error | null;

  // Stats data
  statEntries: StatEntryWithEvent[];
  rating: PlayerRating | null;
  gameStatLines: GameStatLine[];

  // Attendance data
  attendanceStats: AttendanceStats | null;
  eventTypeBreakdown: EventTypeBreakdown | null;
  missedEvents: MissedEvent[];

  // Drill data
  drillParticipation: DrillParticipation[];
  skillProgression: SkillProgressionPoint[];
  trainingVolume: TrainingVolumePoint[];

  // Form data
  playerForm: PlayerForm | null;

  // Refresh function
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing player stats data
 */
export function usePlayerStats(options: UsePlayerStatsOptions): UsePlayerStatsReturn {
  const { playerId, position, period = 'career', customRange, teamId, seasonId } = options;

  // Stats state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [statEntries, setStatEntries] = useState<StatEntryWithEvent[]>([]);
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [gameStatLines, setGameStatLines] = useState<GameStatLine[]>([]);

  // Attendance state
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<Error | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [eventTypeBreakdown, setEventTypeBreakdown] = useState<EventTypeBreakdown | null>(null);
  const [missedEvents, setMissedEvents] = useState<MissedEvent[]>([]);

  // Drill state
  const [isLoadingDrills, setIsLoadingDrills] = useState(true);
  const [drillsError, setDrillsError] = useState<Error | null>(null);
  const [drillParticipation, setDrillParticipation] = useState<DrillParticipation[]>([]);
  const [skillProgression, setSkillProgression] = useState<SkillProgressionPoint[]>([]);
  const [trainingVolume, setTrainingVolume] = useState<TrainingVolumePoint[]>([]);

  // Form state
  const [playerForm, setPlayerForm] = useState<PlayerForm | null>(null);

  // Fetch stats data
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const entries = await getPlayerStats(playerId, period, customRange, teamId, seasonId);
      setStatEntries(entries);

      if (entries.length > 0) {
        const playerRating = calculatePlayerRating(entries, position);
        setRating(playerRating);

        const statLines = getGameStatLines(entries);
        setGameStatLines(statLines);
      } else {
        setRating(null);
        setGameStatLines([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching player stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    setIsLoadingAttendance(true);
    setAttendanceError(null);

    try {
      const [stats, breakdown, timeline, form] = await Promise.all([
        getAttendanceStats(playerId, teamId),
        getEventTypeBreakdown(playerId, teamId),
        getMissedEventsTimeline(playerId, teamId),
        getPlayerForm(playerId, teamId),
      ]);

      setAttendanceStats(stats);
      setEventTypeBreakdown(breakdown);
      setMissedEvents(timeline);
      setPlayerForm(form);
    } catch (err) {
      setAttendanceError(err as Error);
      console.error('Error fetching attendance data:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // Fetch drill data
  const fetchDrills = async () => {
    setIsLoadingDrills(true);
    setDrillsError(null);

    try {
      const [participation, progression, volume] = await Promise.all([
        getDrillParticipation(playerId, teamId),
        getSkillProgression(playerId, teamId),
        getTrainingVolume(playerId, teamId),
      ]);

      setDrillParticipation(participation);
      setSkillProgression(progression);
      setTrainingVolume(volume);
    } catch (err) {
      setDrillsError(err as Error);
      console.error('Error fetching drill data:', err);
    } finally {
      setIsLoadingDrills(false);
    }
  };

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      fetchStats(),
      fetchAttendance(),
      fetchDrills(),
    ]);
  };

  // Initial load - fetch all data in parallel
  useEffect(() => {
    fetchStats();
    fetchAttendance();
    fetchDrills();
  }, [playerId, position, period, customRange, teamId, seasonId]);

  return {
    isLoading,
    isLoadingAttendance,
    isLoadingDrills,
    error,
    attendanceError,
    drillsError,
    statEntries,
    rating,
    gameStatLines,
    attendanceStats,
    eventTypeBreakdown,
    missedEvents,
    drillParticipation,
    skillProgression,
    trainingVolume,
    playerForm,
    refresh,
  };
}
