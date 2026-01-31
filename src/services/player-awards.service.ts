import { supabase } from '@/lib/supabase';
import type { GameAward, GameAwardType, SeasonAward, SeasonAwardType } from '@/types/database.types';

export interface PlayerGameAward extends GameAward {
  event_title: string;
  event_date: string;
  opponent?: string;
}

export interface PlayerSeasonAward extends SeasonAward {
  season_name: string;
  season_start: string;
  season_end: string;
}

export interface PlayerAwardsSummary {
  gameAwards: PlayerGameAward[];
  seasonAwards: PlayerSeasonAward[];
  gameAwardCounts: Record<GameAwardType, number>;
  seasonAwardCounts: Record<SeasonAwardType, number>;
  totalAwards: number;
}

/**
 * Fetch all awards (game + season) for a specific player
 */
export async function getPlayerAwards(playerId: string): Promise<PlayerAwardsSummary> {
  const [gameResult, seasonResult] = await Promise.all([
    supabase
      .from('game_awards')
      .select('*, events!inner(title, start_time, opponent)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('season_awards')
      .select('*, team_seasons!inner(name, start_date, end_date)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false }),
  ]);

  if (gameResult.error) {
    console.error('Error fetching player game awards:', gameResult.error);
    throw gameResult.error;
  }
  if (seasonResult.error) {
    console.error('Error fetching player season awards:', seasonResult.error);
    throw seasonResult.error;
  }

  const gameAwards: PlayerGameAward[] = (gameResult.data || []).map(// eslint-disable-next-line @typescript-eslint/no-explicit-any
  (row: any) => ({
    id: row.id,
    event_id: row.event_id,
    player_id: row.player_id,
    award_type: row.award_type,
    award_value: row.award_value,
    created_at: row.created_at,
    event_title: row.events.title,
    event_date: row.events.start_time,
    opponent: row.events.opponent,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonAwards: PlayerSeasonAward[] = (seasonResult.data || []).map((row: any) => ({
    id: row.id,
    season_id: row.season_id,
    player_id: row.player_id,
    award_type: row.award_type,
    award_value: row.award_value,
    description: row.description,
    created_at: row.created_at,
    season_name: row.team_seasons.name,
    season_start: row.team_seasons.start_date,
    season_end: row.team_seasons.end_date,
  }));

  const gameAwardCounts = {} as Record<GameAwardType, number>;
  for (const a of gameAwards) {
    gameAwardCounts[a.award_type] = (gameAwardCounts[a.award_type] || 0) + 1;
  }

  const seasonAwardCounts = {} as Record<SeasonAwardType, number>;
  for (const a of seasonAwards) {
    seasonAwardCounts[a.award_type] = (seasonAwardCounts[a.award_type] || 0) + 1;
  }

  return {
    gameAwards,
    seasonAwards,
    gameAwardCounts,
    seasonAwardCounts,
    totalAwards: gameAwards.length + seasonAwards.length,
  };
}
