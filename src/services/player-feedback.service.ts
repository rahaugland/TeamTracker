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
