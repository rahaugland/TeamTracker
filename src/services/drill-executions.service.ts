import { supabase } from '@/lib/supabase';
import type { DrillExecution } from '@/types/database.types';

/**
 * Drill Executions service
 * Handles all Supabase operations for drill executions
 */

export interface CreateDrillExecutionInput {
  drill_id: string;
  event_id: string;
  team_id: string;
  executed_at?: string;
  duration_minutes: number;
  coach_rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  recorded_by: string;
}

export interface UpdateDrillExecutionInput {
  duration_minutes?: number;
  coach_rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface DrillExecutionWithDetails extends DrillExecution {
  drill: {
    id: string;
    name: string;
    description: string;
    skill_tags: string[];
    progression_level: number;
  };
  event: {
    id: string;
    title: string;
    start_time: string;
  };
}

/**
 * Create a drill execution
 */
export async function createDrillExecution(
  input: CreateDrillExecutionInput
): Promise<DrillExecution> {
  const { data, error } = await supabase
    .from('drill_executions')
    .insert({
      drill_id: input.drill_id,
      event_id: input.event_id,
      team_id: input.team_id,
      executed_at: input.executed_at || new Date().toISOString(),
      duration_minutes: input.duration_minutes,
      coach_rating: input.coach_rating,
      notes: input.notes,
      recorded_by: input.recorded_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating drill execution:', error);
    throw error;
  }

  return data;
}

/**
 * Update a drill execution
 */
export async function updateDrillExecution(
  id: string,
  input: UpdateDrillExecutionInput
): Promise<DrillExecution> {
  const { data, error } = await supabase
    .from('drill_executions')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating drill execution:', error);
    throw error;
  }

  return data;
}

/**
 * Get executions for a specific drill
 */
export async function getExecutionsByDrill(
  drillId: string
): Promise<DrillExecutionWithDetails[]> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select(`
      *,
      drill:drills(
        id,
        name,
        description,
        skill_tags,
        progression_level
      ),
      event:events(
        id,
        title,
        start_time
      )
    `)
    .eq('drill_id', drillId)
    .order('executed_at', { ascending: false });

  if (error) {
    console.error('Error fetching drill executions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get executions for a specific event
 */
export async function getExecutionsByEvent(
  eventId: string
): Promise<DrillExecutionWithDetails[]> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select(`
      *,
      drill:drills(
        id,
        name,
        description,
        skill_tags,
        progression_level
      ),
      event:events(
        id,
        title,
        start_time
      )
    `)
    .eq('event_id', eventId)
    .order('executed_at', { ascending: false });

  if (error) {
    console.error('Error fetching event executions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get executions for a specific team
 */
export async function getExecutionsByTeam(
  teamId: string
): Promise<DrillExecutionWithDetails[]> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select(`
      *,
      drill:drills(
        id,
        name,
        description,
        skill_tags,
        progression_level
      ),
      event:events(
        id,
        title,
        start_time
      )
    `)
    .eq('team_id', teamId)
    .order('executed_at', { ascending: false });

  if (error) {
    console.error('Error fetching team executions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete a drill execution
 */
export async function deleteDrillExecution(id: string): Promise<void> {
  const { error } = await supabase.from('drill_executions').delete().eq('id', id);

  if (error) {
    console.error('Error deleting drill execution:', error);
    throw error;
  }
}

/**
 * Calculate progression metrics for a drill
 * Returns count of successful executions (rating >= 3)
 */
export async function getProgressionMetrics(
  drillId: string,
  teamId: string
): Promise<{
  totalExecutions: number;
  successfulExecutions: number;
  averageRating: number;
  readyToAdvance: boolean;
}> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select('coach_rating')
    .eq('drill_id', drillId)
    .eq('team_id', teamId)
    .not('coach_rating', 'is', null);

  if (error) {
    console.error('Error fetching progression metrics:', error);
    throw error;
  }

  const executions = data || [];
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter((e) => e.coach_rating && e.coach_rating >= 3).length;

  const ratingsSum = executions.reduce((sum, e) => sum + (e.coach_rating || 0), 0);
  const averageRating = totalExecutions > 0 ? ratingsSum / totalExecutions : 0;

  // Ready to advance if at least 3 successful executions
  const readyToAdvance = successfulExecutions >= 3;

  return {
    totalExecutions,
    successfulExecutions,
    averageRating,
    readyToAdvance,
  };
}

/**
 * Check if a drill execution already exists for an event
 */
export async function getExecutionByEventAndDrill(
  eventId: string,
  drillId: string
): Promise<DrillExecution | null> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select('*')
    .eq('event_id', eventId)
    .eq('drill_id', drillId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching drill execution:', error);
    throw error;
  }

  return data || null;
}
