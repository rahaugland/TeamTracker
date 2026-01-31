import { supabase } from '@/lib/supabase';
import type { StatEntry, GameAward, GameAwardType } from '@/types/database.types';

export interface CalculatedAward {
  award_type: GameAwardType;
  player_id: string;
  award_value: number;
}

/**
 * Calculate MVP score for a player's stat entry
 */
function calcMvpScore(entry: StatEntry): number {
  const blocks = entry.block_solos + entry.block_assists * 0.5;
  return (
    entry.kills * 2 +
    entry.aces * 3 +
    entry.digs +
    blocks * 2 -
    (entry.attack_errors + entry.service_errors) * 1.5
  );
}

/**
 * Calculate match awards from stat entries
 */
export function calculateMatchAwards(statEntries: StatEntry[]): CalculatedAward[] {
  if (statEntries.length === 0) return [];

  const awards: CalculatedAward[] = [];

  // MVP — highest composite score
  let bestMvp: { playerId: string; score: number } | null = null;
  for (const entry of statEntries) {
    const score = calcMvpScore(entry);
    if (!bestMvp || score > bestMvp.score) {
      bestMvp = { playerId: entry.player_id, score };
    }
  }
  if (bestMvp) {
    awards.push({ award_type: 'mvp', player_id: bestMvp.playerId, award_value: bestMvp.score });
  }

  // Top Attacker — highest kill% (min 5 attempts)
  let bestAttacker: { playerId: string; killPct: number } | null = null;
  for (const entry of statEntries) {
    if (entry.attack_attempts < 5) continue;
    const killPct = (entry.kills - entry.attack_errors) / entry.attack_attempts;
    if (!bestAttacker || killPct > bestAttacker.killPct) {
      bestAttacker = { playerId: entry.player_id, killPct };
    }
  }
  if (bestAttacker) {
    awards.push({
      award_type: 'top_attacker',
      player_id: bestAttacker.playerId,
      award_value: Math.round(bestAttacker.killPct * 1000) / 10,
    });
  }

  // Top Server — most aces (tiebreak: fewer service errors)
  let bestServer: { playerId: string; aces: number; serviceErrors: number } | null = null;
  for (const entry of statEntries) {
    if (entry.aces === 0) continue;
    if (
      !bestServer ||
      entry.aces > bestServer.aces ||
      (entry.aces === bestServer.aces && entry.service_errors < bestServer.serviceErrors)
    ) {
      bestServer = { playerId: entry.player_id, aces: entry.aces, serviceErrors: entry.service_errors };
    }
  }
  if (bestServer) {
    awards.push({ award_type: 'top_server', player_id: bestServer.playerId, award_value: bestServer.aces });
  }

  // Top Defender — most digs + blocks combined
  let bestDefender: { playerId: string; total: number } | null = null;
  for (const entry of statEntries) {
    const total = entry.digs + entry.block_solos + entry.block_assists;
    if (total === 0) continue;
    if (!bestDefender || total > bestDefender.total) {
      bestDefender = { playerId: entry.player_id, total };
    }
  }
  if (bestDefender) {
    awards.push({ award_type: 'top_defender', player_id: bestDefender.playerId, award_value: bestDefender.total });
  }

  // Top Passer — highest pass rating (min 5 attempts)
  let bestPasser: { playerId: string; rating: number } | null = null;
  for (const entry of statEntries) {
    if (entry.pass_attempts < 5) continue;
    const rating = entry.pass_sum / entry.pass_attempts;
    if (!bestPasser || rating > bestPasser.rating) {
      bestPasser = { playerId: entry.player_id, rating };
    }
  }
  if (bestPasser) {
    awards.push({
      award_type: 'top_passer',
      player_id: bestPasser.playerId,
      award_value: Math.round(bestPasser.rating * 100) / 100,
    });
  }

  return awards;
}

/**
 * Save match awards to database
 */
export async function saveGameAwards(eventId: string, awards: CalculatedAward[]): Promise<GameAward[]> {
  if (awards.length === 0) return [];

  const rows = awards.map((a) => ({
    event_id: eventId,
    player_id: a.player_id,
    award_type: a.award_type,
    award_value: a.award_value,
  }));

  const { data, error } = await supabase
    .from('game_awards')
    .insert(rows)
    .select();

  if (error) {
    console.error('Error saving game awards:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get awards for an event
 */
export async function getAwardsForEvent(eventId: string): Promise<GameAward[]> {
  const { data, error } = await supabase
    .from('game_awards')
    .select('*')
    .eq('event_id', eventId)
    .order('award_type');

  if (error) {
    console.error('Error fetching game awards:', error);
    throw error;
  }

  return data || [];
}
