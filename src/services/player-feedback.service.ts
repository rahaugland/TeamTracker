import { supabase } from '@/lib/supabase';
import type { PlayerFeedback, PlayerReview, SkillRating, SkillRatingType } from '@/types/database.types';

/**
 * Player feedback service
 * Handles all Supabase operations for player feedback, reviews, and skill ratings
 */

// Types for joined queries
export interface FeedbackWithAuthor extends PlayerFeedback {
  author: { id: string; full_name: string };
  event: { id: string; title: string; start_time: string };
}

export interface ReviewWithAuthor extends PlayerReview {
  author: { id: string; full_name: string };
}

export interface CreateFeedbackInput {
  player_id: string;
  event_id: string;
  author_id: string;
  content: string;
}

export interface CreateReviewInput {
  player_id: string;
  team_id: string;
  season_id?: string;
  author_id: string;
  strengths: string;
  areas_to_improve: string;
  goals_text: string;
}

export interface CreateSkillRatingInput {
  player_id: string;
  team_id: string;
  author_id: string;
  skill_type: SkillRatingType;
  rating: number;
}

/**
 * Get all feedback for a player
 */
export async function getPlayerFeedback(playerId: string): Promise<FeedbackWithAuthor[]> {
  const { data, error } = await supabase
    .from('player_feedback')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name
      ),
      event:events!event_id(
        id,
        title,
        start_time
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching player feedback:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create feedback for a player
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<PlayerFeedback> {
  const { data, error } = await supabase
    .from('player_feedback')
    .insert({
      player_id: input.player_id,
      event_id: input.event_id,
      author_id: input.author_id,
      content: input.content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }

  return data;
}

/**
 * Get all feedback for a specific event
 */
export async function getEventFeedback(eventId: string): Promise<FeedbackWithAuthor[]> {
  const { data, error } = await supabase
    .from('player_feedback')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name
      ),
      event:events!event_id(
        id,
        title,
        start_time
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event feedback:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase.from('player_feedback').delete().eq('id', id);

  if (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
}

/**
 * Get all reviews for a player
 */
export async function getPlayerReviews(playerId: string): Promise<ReviewWithAuthor[]> {
  const { data, error } = await supabase
    .from('player_reviews')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching player reviews:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a player review
 */
export async function createReview(input: CreateReviewInput): Promise<PlayerReview> {
  const { data, error } = await supabase
    .from('player_reviews')
    .insert({
      player_id: input.player_id,
      team_id: input.team_id,
      season_id: input.season_id,
      author_id: input.author_id,
      strengths: input.strengths,
      areas_to_improve: input.areas_to_improve,
      goals_text: input.goals_text,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a review
 */
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('player_reviews').delete().eq('id', id);

  if (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

/**
 * Get all skill ratings for a player
 */
export async function getPlayerSkillRatings(playerId: string): Promise<SkillRating[]> {
  const { data, error } = await supabase
    .from('skill_ratings')
    .select('*')
    .eq('player_id', playerId)
    .order('rated_at', { ascending: false });

  if (error) {
    console.error('Error fetching skill ratings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a skill rating
 */
export async function createSkillRating(input: CreateSkillRatingInput): Promise<SkillRating> {
  const { data, error } = await supabase
    .from('skill_ratings')
    .insert({
      player_id: input.player_id,
      team_id: input.team_id,
      author_id: input.author_id,
      skill_type: input.skill_type,
      rating: input.rating,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating skill rating:', error);
    throw error;
  }

  return data;
}

/**
 * Get latest skill rating for each skill type for a player
 */
export async function getLatestSkillRatings(playerId: string): Promise<SkillRating[]> {
  // Get all ratings first
  const allRatings = await getPlayerSkillRatings(playerId);

  // Group by skill_type and get the latest (first in array after sort by rated_at desc)
  const latestByType = new Map<SkillRatingType, SkillRating>();

  for (const rating of allRatings) {
    if (!latestByType.has(rating.skill_type)) {
      latestByType.set(rating.skill_type, rating);
    }
  }

  return Array.from(latestByType.values());
}

/**
 * Skill rating with history - includes current value, previous value, change, and trend
 */
export interface SkillRatingWithHistory {
  type: string;
  label: string;
  abbr: string;
  value: number;
  previousValue: number | null;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

/**
 * All skill colors for the 8 skill types
 */
const SKILL_COLORS: Record<string, string> = {
  serve: '#E63946',     // club-primary red
  receive: '#2EC4B6',   // vq-teal
  set: '#FFB703',       // club-secondary yellow
  block: '#3B82F6',     // blue
  attack: '#22C55E',    // green
  defense: '#9333EA',   // purple
  mental: '#EC4899',    // pink
  physique: '#F97316',  // orange
};

/**
 * Get skill ratings with history for a player
 * Returns 8 skills including Mental and Physique derived from other data
 * If no manual skill ratings exist, derives them from game stats
 */
export async function getSkillRatingsWithHistory(
  playerId: string,
  teamId?: string
): Promise<SkillRatingWithHistory[]> {
  const allRatings = await getPlayerSkillRatings(playerId);

  // Filter by team if provided
  const filteredRatings = teamId
    ? allRatings.filter(r => r.team_id === teamId)
    : allRatings;

  // Group by skill_type and get latest + previous
  const ratingsByType = new Map<SkillRatingType, SkillRating[]>();

  for (const rating of filteredRatings) {
    if (!ratingsByType.has(rating.skill_type)) {
      ratingsByType.set(rating.skill_type, []);
    }
    ratingsByType.get(rating.skill_type)!.push(rating);
  }

  // If no manual ratings exist, try to derive from game stats
  const hasManualRatings = filteredRatings.length > 0;
  let derivedSkills: Map<string, number> = new Map();

  if (!hasManualRatings) {
    derivedSkills = await deriveSkillsFromStats(playerId, teamId);
  }

  const skills: SkillRatingWithHistory[] = [];

  // Map database skill types to display format
  const skillMappings: Array<{
    dbType: SkillRatingType;
    label: string;
    abbr: string;
    type: string;
    derivedKey?: string;
  }> = [
    { dbType: 'serve', label: 'Serve', abbr: 'SRV', type: 'serve', derivedKey: 'serve' },
    { dbType: 'pass', label: 'Receive', abbr: 'RCV', type: 'receive', derivedKey: 'reception' },
    { dbType: 'set', label: 'Set', abbr: 'SET', type: 'set', derivedKey: 'set' },
    { dbType: 'block', label: 'Block', abbr: 'BLK', type: 'block', derivedKey: 'block' },
    { dbType: 'attack', label: 'Attack', abbr: 'ATK', type: 'attack', derivedKey: 'attack' },
    { dbType: 'defense', label: 'Digs', abbr: 'DIG', type: 'defense', derivedKey: 'defense' },
  ];

  // Process database skills or use derived values
  for (const mapping of skillMappings) {
    const ratings = ratingsByType.get(mapping.dbType) || [];
    let current: number;
    let previous: number | null = null;

    if (ratings.length > 0) {
      // Use manual ratings
      current = ratings[0].rating;
      previous = ratings[1]?.rating || null;
    } else if (mapping.derivedKey && derivedSkills.has(mapping.derivedKey)) {
      // Use derived rating from stats
      current = derivedSkills.get(mapping.derivedKey)!;
    } else {
      // Default to 50 when no data
      current = 50;
    }

    const change = previous !== null ? current - previous : 0;
    const trend: 'up' | 'down' | 'stable' = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    skills.push({
      type: mapping.type,
      label: mapping.label,
      abbr: mapping.abbr,
      value: current,
      previousValue: previous,
      change,
      trend,
      color: SKILL_COLORS[mapping.type],
    });
  }

  // Calculate Mental (derived from defense and pass ratings as proxy for consistency)
  const defenseSkill = skills.find(s => s.type === 'defense');
  const passSkill = skills.find(s => s.type === 'receive');
  const mentalValue = Math.round(((defenseSkill?.value || 50) + (passSkill?.value || 50)) / 2);
  const mentalPrevious = defenseSkill?.previousValue && passSkill?.previousValue
    ? Math.round((defenseSkill.previousValue + passSkill.previousValue) / 2)
    : null;
  const mentalChange = mentalPrevious !== null ? mentalValue - mentalPrevious : 0;

  skills.push({
    type: 'mental',
    label: 'Mental',
    abbr: 'MNT',
    value: mentalValue,
    previousValue: mentalPrevious,
    change: mentalChange,
    trend: mentalChange > 0 ? 'up' : mentalChange < 0 ? 'down' : 'stable',
    color: SKILL_COLORS.mental,
  });

  // Calculate Physique (derived from attack and serve ratings)
  const attackSkill = skills.find(s => s.type === 'attack');
  const serveSkill = skills.find(s => s.type === 'serve');
  const physiqueValue = Math.round(((attackSkill?.value || 50) + (serveSkill?.value || 50)) / 2);
  const physiquePrevious = attackSkill?.previousValue && serveSkill?.previousValue
    ? Math.round((attackSkill.previousValue + serveSkill.previousValue) / 2)
    : null;
  const physiqueChange = physiquePrevious !== null ? physiqueValue - physiquePrevious : 0;

  skills.push({
    type: 'physique',
    label: 'Physique',
    abbr: 'PHY',
    value: physiqueValue,
    previousValue: physiquePrevious,
    change: physiqueChange,
    trend: physiqueChange > 0 ? 'up' : physiqueChange < 0 ? 'down' : 'stable',
    color: SKILL_COLORS.physique,
  });

  return skills;
}

/**
 * Derive skill ratings from game statistics when no manual ratings exist
 * Uses the same calculation logic as the player rating system
 */
async function deriveSkillsFromStats(
  playerId: string,
  teamId?: string
): Promise<Map<string, number>> {
  const skills = new Map<string, number>();

  try {
    // Import dynamically to avoid circular dependency
    const { getPlayerStats, aggregateStats } = await import('./player-stats.service');
    const stats = await getPlayerStats(playerId, 'career', undefined, teamId);

    if (stats.length === 0) {
      return skills;
    }

    const agg = aggregateStats(stats);

    // Attack (efficiency-based, 1-99 scale)
    if (agg.totalAttackAttempts > 0) {
      const killPct = (agg.totalKills - agg.totalAttackErrors) / agg.totalAttackAttempts;
      const attackRating = Math.max(1, Math.min(99, Math.round(killPct * 165)));
      skills.set('attack', attackRating);
    }

    // Serve (ace rate and error rate)
    if (agg.totalServeAttempts > 0) {
      const aceRate = agg.totalAces / agg.totalServeAttempts;
      const errorRate = agg.totalServiceErrors / agg.totalServeAttempts;
      const serveScore = (aceRate * 3) + (1 - errorRate);
      const serveRating = Math.max(1, Math.min(99, Math.round(serveScore * 76)));
      skills.set('serve', serveRating);
    }

    // Reception (pass rating 0-3 scale to 1-99)
    if (agg.totalPassAttempts > 0) {
      const receptionRating = Math.max(1, Math.min(99, Math.round(agg.passRating * 33)));
      skills.set('reception', receptionRating);
    }

    // Block (blocks per game to 1-99)
    if (agg.gamesPlayed > 0) {
      const blocksPerGame = (agg.totalBlockSolos + agg.totalBlockAssists * 0.5) / agg.gamesPlayed;
      const blockRating = Math.max(1, Math.min(99, Math.round(20 + blocksPerGame * 25)));
      skills.set('block', blockRating);
    }

    // Defense (digs per game to 1-99)
    if (agg.gamesPlayed > 0) {
      const digsPerGame = agg.totalDigs / agg.gamesPlayed;
      const defenseRating = Math.max(1, Math.min(99, Math.round(20 + digsPerGame * 8)));
      skills.set('defense', defenseRating);
    }

    // Set (set rating if available)
    if (agg.totalSetAttempts > 0) {
      const setRating = Math.max(1, Math.min(99, Math.round(agg.setRating * 33)));
      skills.set('set', setRating);
    }

  } catch (error) {
    console.error('Error deriving skills from stats:', error);
  }

  return skills;
}
