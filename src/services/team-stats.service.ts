import { supabase } from '@/lib/supabase';
import type { Event, VolleyballPosition } from '@/types/database.types';
import { calculatePlayerRating, getPlayerStats, type SubRatings } from './player-stats.service';

/**
 * Team Stats Service
 * Handles team-level statistics, ratings, and analytics
 */

export interface TeamRating {
  overall: number; // 1-99
  subRatings: SubRatings;
  playerCount: number;
  isProvisional: boolean; // true if fewer than 3 players with game stats
}

export interface TeamGameStat {
  eventId: string;
  eventTitle: string;
  date: string;
  opponent?: string;
  opponentTier?: number;
  result: 'W' | 'L' | 'D';
  setsWon: number;
  setsLost: number;
  setScores?: number[][];
  killPercentage: number;
  servePercentage: number;
  passRating: number;
}

export interface BestXIPlayer {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  position: VolleyballPosition;
  rating: number;
  jerseyNumber?: number;
}

export interface BestXI {
  setter: BestXIPlayer | null;
  outsideHitter1: BestXIPlayer | null;
  outsideHitter2: BestXIPlayer | null;
  middleBlocker1: BestXIPlayer | null;
  middleBlocker2: BestXIPlayer | null;
  opposite: BestXIPlayer | null;
  libero: BestXIPlayer | null;
}

export type FormResult = 'W' | 'L' | 'D';

export interface FormStreak {
  results: FormResult[]; // Last 5 games, most recent first
  winRate: number; // percentage
}

/**
 * Get team overall rating (average of all active player ratings)
 */
export async function getTeamRating(teamId: string): Promise<TeamRating> {
  try {
    // Get active players on the team
    const { data: memberships, error: memberError } = await supabase
      .from('team_memberships')
      .select(`
        player_id,
        player:players(
          id,
          positions
        )
      `)
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (memberError) throw memberError;

    if (!memberships || memberships.length === 0) {
      return {
        overall: 1,
        subRatings: { serve: 1, receive: 1, set: 1, block: 1, attack: 1, dig: 1, mental: 1, physique: 1 },
        playerCount: 0,
        isProvisional: true,
      };
    }

    // Calculate rating for each player
    const playerRatings = await Promise.all(
      memberships.map(async (membership: any) => {
        const playerId = membership.player_id;
        const primaryPosition = membership.player?.positions?.[0] || 'all_around';

        const statEntries = await getPlayerStats(playerId, 'career', undefined, teamId);
        if (statEntries.length === 0) return null;

        const rating = calculatePlayerRating(statEntries, primaryPosition);
        return rating;
      })
    );

    // Filter out players without stats
    const validRatings = playerRatings.filter((r) => r !== null && r.gamesPlayed > 0);

    if (validRatings.length === 0) {
      return {
        overall: 1,
        subRatings: { serve: 1, receive: 1, set: 1, block: 1, attack: 1, dig: 1, mental: 1, physique: 1 },
        playerCount: memberships.length,
        isProvisional: true,
      };
    }

    // Calculate average ratings
    const avgOverall =
      validRatings.reduce((sum, r) => sum + r!.overall, 0) / validRatings.length;

    const skillKeys = ['serve', 'receive', 'set', 'block', 'attack', 'dig', 'mental', 'physique'] as const;
    const avgSubRatings = {} as SubRatings;
    for (const key of skillKeys) {
      avgSubRatings[key] = validRatings.reduce((sum, r) => sum + r!.subRatings[key], 0) / validRatings.length;
    }

    const roundedSubRatings = {} as SubRatings;
    for (const key of skillKeys) {
      roundedSubRatings[key] = Math.round(avgSubRatings[key]);
    }

    return {
      overall: Math.round(avgOverall),
      subRatings: roundedSubRatings,
      playerCount: validRatings.length,
      isProvisional: validRatings.length < 3,
    };
  } catch (error) {
    console.error('Error calculating team rating:', error);
    throw error;
  }
}

/**
 * Get team game stats (per-game breakdown with match results)
 */
export async function getTeamGameStats(teamId: string): Promise<TeamGameStat[]> {
  try {
    // Get all game/tournament events with stats
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('team_id', teamId)
      .in('type', ['game', 'tournament'])
      .order('start_time', { ascending: false });

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) return [];

    const gameStats: TeamGameStat[] = await Promise.all(
      events.map(async (event: Event) => {
        // Get all stat entries for this event
        const { data: statEntries, error: statsError } = await supabase
          .from('stat_entries')
          .select('*')
          .eq('event_id', event.id);

        if (statsError) throw statsError;

        // Calculate team totals
        const totals = (statEntries || []).reduce(
          (acc, stat) => ({
            kills: acc.kills + stat.kills,
            attackAttempts: acc.attackAttempts + stat.attack_attempts,
            attackErrors: acc.attackErrors + stat.attack_errors,
            aces: acc.aces + stat.aces,
            serveAttempts: acc.serveAttempts + stat.serve_attempts,
            serviceErrors: acc.serviceErrors + stat.service_errors,
            passSum: acc.passSum + stat.pass_sum,
            passAttempts: acc.passAttempts + stat.pass_attempts,
          }),
          {
            kills: 0,
            attackAttempts: 0,
            attackErrors: 0,
            aces: 0,
            serveAttempts: 0,
            serviceErrors: 0,
            passSum: 0,
            passAttempts: 0,
          }
        );

        const killPercentage =
          totals.attackAttempts > 0
            ? (totals.kills - totals.attackErrors) / totals.attackAttempts
            : 0;

        const servePercentage =
          totals.serveAttempts > 0
            ? (totals.serveAttempts - totals.serviceErrors) / totals.serveAttempts
            : 0;

        const passRating =
          totals.passAttempts > 0 ? totals.passSum / totals.passAttempts : 0;

        // Determine result
        let result: 'W' | 'L' | 'D' = 'D';
        const setsWon = event.sets_won || 0;
        const setsLost = event.sets_lost || 0;

        if (setsWon > setsLost) result = 'W';
        else if (setsLost > setsWon) result = 'L';

        return {
          eventId: event.id,
          eventTitle: event.title,
          date: event.start_time,
          opponent: event.opponent,
          opponentTier: event.opponent_tier ?? undefined,
          result,
          setsWon,
          setsLost,
          setScores: event.set_scores,
          killPercentage,
          servePercentage,
          passRating,
        };
      })
    );

    return gameStats;
  } catch (error) {
    console.error('Error getting team game stats:', error);
    throw error;
  }
}

/**
 * Get best starting lineup (1 setter, 2 OH, 2 MB, 1 OPP, 1 Libero)
 */
export async function getBestXI(teamId: string): Promise<BestXI> {
  try {
    // Get all active players with their positions and ratings
    const { data: memberships, error: memberError } = await supabase
      .from('team_memberships')
      .select(`
        player_id,
        jersey_number,
        player:players(
          id,
          name,
          photo_url,
          positions
        )
      `)
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (memberError) throw memberError;

    if (!memberships || memberships.length === 0) {
      return {
        setter: null,
        outsideHitter1: null,
        outsideHitter2: null,
        middleBlocker1: null,
        middleBlocker2: null,
        opposite: null,
        libero: null,
      };
    }

    // Calculate rating for each player
    const playersWithRatings = await Promise.all(
      memberships.map(async (membership: any) => {
        const playerId = membership.player_id;
        const player = membership.player;
        const primaryPosition = player?.positions?.[0] || 'all_around';

        const statEntries = await getPlayerStats(playerId, 'career', undefined, teamId);

        let rating = 1;
        if (statEntries.length > 0) {
          const playerRating = calculatePlayerRating(statEntries, primaryPosition);
          rating = playerRating.overall;
        }

        return {
          playerId: player.id,
          playerName: player.name,
          photoUrl: player.photo_url,
          positions: player.positions || [],
          rating,
          jerseyNumber: membership.jersey_number,
        };
      })
    );

    // Helper to find best player for a position
    const findBestForPosition = (
      position: VolleyballPosition,
      exclude: string[] = []
    ): BestXIPlayer | null => {
      const candidates = playersWithRatings.filter(
        (p) => p.positions.includes(position) && !exclude.includes(p.playerId)
      );

      if (candidates.length === 0) return null;

      const best = candidates.reduce((prev, current) =>
        current.rating > prev.rating ? current : prev
      );

      return {
        playerId: best.playerId,
        playerName: best.playerName,
        photoUrl: best.photoUrl,
        position,
        rating: best.rating,
        jerseyNumber: best.jerseyNumber,
      };
    };

    const usedPlayerIds: string[] = [];

    // Setter (1)
    const setter = findBestForPosition('setter', usedPlayerIds);
    if (setter) usedPlayerIds.push(setter.playerId);

    // Libero (1)
    const libero = findBestForPosition('libero', usedPlayerIds);
    if (libero) usedPlayerIds.push(libero.playerId);

    // Outside Hitters (2)
    const outsideHitter1 = findBestForPosition('outside_hitter', usedPlayerIds);
    if (outsideHitter1) usedPlayerIds.push(outsideHitter1.playerId);

    const outsideHitter2 = findBestForPosition('outside_hitter', usedPlayerIds);
    if (outsideHitter2) usedPlayerIds.push(outsideHitter2.playerId);

    // Middle Blockers (2)
    const middleBlocker1 = findBestForPosition('middle_blocker', usedPlayerIds);
    if (middleBlocker1) usedPlayerIds.push(middleBlocker1.playerId);

    const middleBlocker2 = findBestForPosition('middle_blocker', usedPlayerIds);
    if (middleBlocker2) usedPlayerIds.push(middleBlocker2.playerId);

    // Opposite (1)
    const opposite = findBestForPosition('opposite', usedPlayerIds);

    return {
      setter,
      outsideHitter1,
      outsideHitter2,
      middleBlocker1,
      middleBlocker2,
      opposite,
      libero,
    };
  } catch (error) {
    console.error('Error getting best XI:', error);
    throw error;
  }
}

/**
 * Get form streak (last 5 game results)
 */
export async function getFormStreak(teamId: string): Promise<FormStreak> {
  try {
    // Get last 5 games with results
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('sets_won, sets_lost')
      .eq('team_id', teamId)
      .in('type', ['game', 'tournament'])
      .not('sets_won', 'is', null)
      .not('sets_lost', 'is', null)
      .order('start_time', { ascending: false })
      .limit(5);

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return {
        results: [],
        winRate: 0,
      };
    }

    const results: FormResult[] = events.map((event) => {
      const setsWon = event.sets_won || 0;
      const setsLost = event.sets_lost || 0;

      if (setsWon > setsLost) return 'W';
      if (setsLost > setsWon) return 'L';
      return 'D';
    });

    const wins = results.filter((r) => r === 'W').length;
    const winRate = events.length > 0 ? (wins / events.length) * 100 : 0;

    return {
      results,
      winRate: Math.round(winRate),
    };
  } catch (error) {
    console.error('Error getting form streak:', error);
    throw error;
  }
}
