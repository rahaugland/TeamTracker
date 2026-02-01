import { supabase } from '@/lib/supabase';
import type { SelfAssessment } from '@/types/database.types';

/**
 * Self-assessment service
 * Handles all Supabase operations for player self-assessments
 */

export interface SelfAssessmentWithEvent extends SelfAssessment {
  event: { id: string; title: string; type: string; start_time: string };
}

export interface CreateSelfAssessmentInput {
  player_id: string;
  event_id: string;
  rating: number;
  notes?: string;
}

/**
 * Get all self-assessments for a player
 */
export async function getPlayerSelfAssessments(playerId: string): Promise<SelfAssessmentWithEvent[]> {
  const { data, error } = await supabase
    .from('self_assessments')
    .select(`
      *,
      event:events!event_id(
        id,
        title,
        type,
        start_time
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching self-assessments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create or update a self-assessment (upsert)
 * If a self-assessment already exists for the player_id + event_id combination, it will be updated
 */
export async function createSelfAssessment(input: CreateSelfAssessmentInput): Promise<SelfAssessment> {
  const { data, error } = await supabase
    .from('self_assessments')
    .upsert(
      {
        player_id: input.player_id,
        event_id: input.event_id,
        rating: input.rating,
        notes: input.notes,
      },
      {
        onConflict: 'player_id,event_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating self-assessment:', error);
    throw error;
  }

  return data;
}

/**
 * Update a self-assessment
 */
export async function updateSelfAssessment(
  id: string,
  input: Partial<Pick<SelfAssessment, 'rating' | 'notes'>>
): Promise<SelfAssessment> {
  const { data, error } = await supabase
    .from('self_assessments')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating self-assessment:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a self-assessment
 */
export async function deleteSelfAssessment(id: string): Promise<void> {
  const { error } = await supabase.from('self_assessments').delete().eq('id', id);

  if (error) {
    console.error('Error deleting self-assessment:', error);
    throw error;
  }
}
