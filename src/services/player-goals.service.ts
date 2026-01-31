import { supabase } from '@/lib/supabase';
import type { PlayerGoal, GoalMetricType } from '@/types/database.types';
import { getPlayerStats, aggregateStats, getAttendanceStats } from './player-stats.service';

export interface CreatePlayerGoalInput {
  player_id: string;
  team_id: string;
  title: string;
  description?: string;
  metric_type: GoalMetricType;
  target_value: number;
  deadline?: string;
  created_by: string;
}

export interface UpdatePlayerGoalInput {
  title?: string;
  description?: string;
  metric_type?: GoalMetricType;
  target_value?: number;
  current_value?: number;
  deadline?: string;
  is_completed?: boolean;
  completed_at?: string;
}

/**
 * Get all goals for a player on a team
 */
export async function getPlayerGoals(playerId: string, teamId: string): Promise<PlayerGoal[]> {
  const { data, error } = await supabase
    .from('player_goals')
    .select('*')
    .eq('player_id', playerId)
    .eq('team_id', teamId)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching player goals:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new player goal
 */
export async function createPlayerGoal(input: CreatePlayerGoalInput): Promise<PlayerGoal> {
  const { data, error } = await supabase
    .from('player_goals')
    .insert({
      player_id: input.player_id,
      team_id: input.team_id,
      title: input.title,
      description: input.description,
      metric_type: input.metric_type,
      target_value: input.target_value,
      deadline: input.deadline || null,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating player goal:', error);
    throw error;
  }

  return data;
}

/**
 * Update a player goal
 */
export async function updatePlayerGoal(id: string, updates: UpdatePlayerGoalInput): Promise<PlayerGoal> {
  const { data, error } = await supabase
    .from('player_goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating player goal:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a player goal
 */
export async function deletePlayerGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('player_goals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting player goal:', error);
    throw error;
  }
}

/**
 * Toggle goal completion
 */
export async function toggleGoalCompletion(id: string, isCompleted: boolean): Promise<PlayerGoal> {
  return updatePlayerGoal(id, {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : undefined,
  });
}

/**
 * Refresh auto-progress for all non-custom, non-completed goals for a player.
 * Call this after stat entry create/update.
 */
export async function refreshGoalProgress(playerId: string, teamId: string): Promise<void> {
  const goals = await getPlayerGoals(playerId, teamId);
  const activeGoals = goals.filter(g => !g.is_completed && g.metric_type !== 'custom');

  if (activeGoals.length === 0) return;

  // Determine which metrics we need
  const needsStats = activeGoals.some(g =>
    ['kill_pct', 'pass_rating', 'serve_pct'].includes(g.metric_type)
  );
  const needsAttendance = activeGoals.some(g => g.metric_type === 'attendance');

  let killPct = 0;
  let passRating = 0;
  let servePct = 0;
  let attendanceRate = 0;

  if (needsStats) {
    const statEntries = await getPlayerStats(playerId, 'career', undefined, teamId);
    const agg = aggregateStats(statEntries);
    killPct = agg.killPercentage * 100;
    servePct = agg.servePercentage * 100;
    passRating = agg.passRating;
  }

  if (needsAttendance) {
    const att = await getAttendanceStats(playerId, teamId);
    attendanceRate = att.attendanceRate * 100;
  }

  for (const goal of activeGoals) {
    let currentValue = 0;
    switch (goal.metric_type) {
      case 'kill_pct':
        currentValue = killPct;
        break;
      case 'pass_rating':
        currentValue = passRating;
        break;
      case 'serve_pct':
        currentValue = servePct;
        break;
      case 'attendance':
        currentValue = attendanceRate;
        break;
    }

    if (currentValue !== goal.current_value) {
      await updatePlayerGoal(goal.id, { current_value: currentValue });
    }
  }
}
