import { useState, useEffect } from 'react';
import {
  getTeamRating,
  getTeamGameStats,
  getBestXI,
  getFormStreak,
  type TeamRating,
  type TeamGameStat,
  type BestXI,
  type FormStreak,
} from '@/services/team-stats.service';

interface UseTeamStatsOptions {
  teamId: string;
}

interface UseTeamStatsReturn {
  // Loading states
  isLoading: boolean;
  isLoadingRating: boolean;
  isLoadingGames: boolean;
  isLoadingBestXI: boolean;
  isLoadingForm: boolean;

  // Error states
  error: Error | null;
  ratingError: Error | null;
  gamesError: Error | null;
  bestXIError: Error | null;
  formError: Error | null;

  // Data
  teamRating: TeamRating | null;
  gameStats: TeamGameStat[];
  bestXI: BestXI | null;
  formStreak: FormStreak | null;

  // Refresh function
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing team-level stats
 */
export function useTeamStats(options: UseTeamStatsOptions): UseTeamStatsReturn {
  const { teamId } = options;

  // Rating state
  const [isLoadingRating, setIsLoadingRating] = useState(true);
  const [ratingError, setRatingError] = useState<Error | null>(null);
  const [teamRating, setTeamRating] = useState<TeamRating | null>(null);

  // Game stats state
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gamesError, setGamesError] = useState<Error | null>(null);
  const [gameStats, setGameStats] = useState<TeamGameStat[]>([]);

  // Best XI state
  const [isLoadingBestXI, setIsLoadingBestXI] = useState(true);
  const [bestXIError, setBestXIError] = useState<Error | null>(null);
  const [bestXI, setBestXI] = useState<BestXI | null>(null);

  // Form state
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [formError, setFormError] = useState<Error | null>(null);
  const [formStreak, setFormStreak] = useState<FormStreak | null>(null);

  // Fetch team rating
  const fetchRating = async () => {
    setIsLoadingRating(true);
    setRatingError(null);

    try {
      const rating = await getTeamRating(teamId);
      setTeamRating(rating);
    } catch (err) {
      setRatingError(err as Error);
      console.error('Error fetching team rating:', err);
    } finally {
      setIsLoadingRating(false);
    }
  };

  // Fetch game stats
  const fetchGames = async () => {
    setIsLoadingGames(true);
    setGamesError(null);

    try {
      const games = await getTeamGameStats(teamId);
      setGameStats(games);
    } catch (err) {
      setGamesError(err as Error);
      console.error('Error fetching game stats:', err);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Fetch best XI
  const fetchBestXI = async () => {
    setIsLoadingBestXI(true);
    setBestXIError(null);

    try {
      const lineup = await getBestXI(teamId);
      setBestXI(lineup);
    } catch (err) {
      setBestXIError(err as Error);
      console.error('Error fetching best XI:', err);
    } finally {
      setIsLoadingBestXI(false);
    }
  };

  // Fetch form streak
  const fetchForm = async () => {
    setIsLoadingForm(true);
    setFormError(null);

    try {
      const form = await getFormStreak(teamId);
      setFormStreak(form);
    } catch (err) {
      setFormError(err as Error);
      console.error('Error fetching form streak:', err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  // Refresh all data
  const refresh = async () => {
    await Promise.all([fetchRating(), fetchGames(), fetchBestXI(), fetchForm()]);
  };

  // Initial load - fetch all data in parallel
  useEffect(() => {
    fetchRating();
    fetchGames();
    fetchBestXI();
    fetchForm();
  }, [teamId]);

  const isLoading =
    isLoadingRating || isLoadingGames || isLoadingBestXI || isLoadingForm;
  const error = ratingError || gamesError || bestXIError || formError;

  return {
    isLoading,
    isLoadingRating,
    isLoadingGames,
    isLoadingBestXI,
    isLoadingForm,
    error,
    ratingError,
    gamesError,
    bestXIError,
    formError,
    teamRating,
    gameStats,
    bestXI,
    formStreak,
    refresh,
  };
}
