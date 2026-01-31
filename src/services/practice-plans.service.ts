import { supabase } from '@/lib/supabase';
import type { PracticePlan, PracticeBlock, PracticeBlockType } from '@/types/database.types';

/**
 * Practice Plans service
 * Handles all Supabase operations for practice plans and blocks
 */

export interface CreatePracticePlanInput {
  name: string;
  team_id: string;
  date?: string;
  notes?: string;
  created_by: string;
}

export interface UpdatePracticePlanInput {
  name?: string;
  team_id?: string;
  date?: string;
  notes?: string;
}

export interface CreatePracticeBlockInput {
  practice_plan_id: string;
  order_index: number;
  type: PracticeBlockType;
  drill_id?: string;
  custom_title?: string;
  duration_minutes: number;
  notes?: string;
}

export interface UpdatePracticeBlockInput {
  order_index?: number;
  type?: PracticeBlockType;
  drill_id?: string;
  custom_title?: string;
  duration_minutes?: number;
  notes?: string;
}

export interface PracticePlanWithBlocks extends PracticePlan {
  practice_blocks: (PracticeBlock & {
    drill?: {
      id: string;
      name: string;
      description: string;
      skill_tags: string[];
      progression_level: number;
    } | null;
  })[];
  team: {
    id: string;
    name: string;
  };
}

/**
 * Get all practice plans
 */
export async function getPracticePlans(): Promise<PracticePlan[]> {
  const { data, error } = await supabase
    .from('practice_plans')
    .select('*')
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching practice plans:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get practice plans by team
 */
export async function getPracticePlansByTeam(teamId: string): Promise<PracticePlan[]> {
  const { data, error } = await supabase
    .from('practice_plans')
    .select('*')
    .eq('team_id', teamId)
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching practice plans by team:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single practice plan by ID with all blocks
 */
export async function getPracticePlan(id: string): Promise<PracticePlanWithBlocks | null> {
  const { data, error } = await supabase
    .from('practice_plans')
    .select(`
      *,
      team:teams(
        id,
        name
      ),
      practice_blocks(
        *,
        drill:drills(
          id,
          name,
          description,
          skill_tags,
          progression_level
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching practice plan:', error);
    throw error;
  }

  // Sort blocks by order_index
  if (data && data.practice_blocks) {
    data.practice_blocks.sort((a: any, b: any) => a.order_index - b.order_index);
  }

  return data;
}

/**
 * Create a new practice plan
 */
export async function createPracticePlan(input: CreatePracticePlanInput): Promise<PracticePlan> {
  const { data, error } = await supabase
    .from('practice_plans')
    .insert({
      name: input.name,
      team_id: input.team_id,
      date: input.date,
      notes: input.notes,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating practice plan:', error);
    throw error;
  }

  return data;
}

/**
 * Update a practice plan
 */
export async function updatePracticePlan(
  id: string,
  input: UpdatePracticePlanInput
): Promise<PracticePlan> {
  const { data, error } = await supabase
    .from('practice_plans')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating practice plan:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a practice plan
 */
export async function deletePracticePlan(id: string): Promise<void> {
  const { error } = await supabase.from('practice_plans').delete().eq('id', id);

  if (error) {
    console.error('Error deleting practice plan:', error);
    throw error;
  }
}

/**
 * Create a practice block
 */
export async function createPracticeBlock(input: CreatePracticeBlockInput): Promise<PracticeBlock> {
  const { data, error } = await supabase
    .from('practice_blocks')
    .insert({
      practice_plan_id: input.practice_plan_id,
      order_index: input.order_index,
      type: input.type,
      drill_id: input.drill_id,
      custom_title: input.custom_title,
      duration_minutes: input.duration_minutes,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating practice block:', error);
    throw error;
  }

  return data;
}

/**
 * Update a practice block
 */
export async function updatePracticeBlock(
  id: string,
  input: UpdatePracticeBlockInput
): Promise<PracticeBlock> {
  const { data, error } = await supabase
    .from('practice_blocks')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating practice block:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a practice block
 */
export async function deletePracticeBlock(id: string): Promise<void> {
  const { error } = await supabase.from('practice_blocks').delete().eq('id', id);

  if (error) {
    console.error('Error deleting practice block:', error);
    throw error;
  }
}

/**
 * Reorder practice blocks
 */
export async function reorderPracticeBlocks(
  planId: string,
  blockIds: string[]
): Promise<void> {
  // Update each block with its new order_index
  const updates = blockIds.map((blockId, index) =>
    supabase
      .from('practice_blocks')
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq('id', blockId)
      .eq('practice_plan_id', planId)
  );

  const results = await Promise.all(updates);

  // Check for errors
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    console.error('Error reordering practice blocks:', errors);
    throw new Error('Failed to reorder blocks');
  }
}

/**
 * Move a block up in the order
 */
export async function moveBlockUp(planId: string, blockId: string): Promise<void> {
  const plan = await getPracticePlan(planId);
  if (!plan) throw new Error('Practice plan not found');

  const blocks = plan.practice_blocks;
  const currentIndex = blocks.findIndex((b) => b.id === blockId);

  if (currentIndex <= 0) return; // Already at top or not found

  // Swap with previous block
  const newOrder = blocks.map((b) => b.id);
  [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
    newOrder[currentIndex],
    newOrder[currentIndex - 1],
  ];

  await reorderPracticeBlocks(planId, newOrder);
}

/**
 * Move a block down in the order
 */
export async function moveBlockDown(planId: string, blockId: string): Promise<void> {
  const plan = await getPracticePlan(planId);
  if (!plan) throw new Error('Practice plan not found');

  const blocks = plan.practice_blocks;
  const currentIndex = blocks.findIndex((b) => b.id === blockId);

  if (currentIndex === -1 || currentIndex >= blocks.length - 1) return; // Already at bottom or not found

  // Swap with next block
  const newOrder = blocks.map((b) => b.id);
  [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
    newOrder[currentIndex + 1],
    newOrder[currentIndex],
  ];

  await reorderPracticeBlocks(planId, newOrder);
}

/**
 * Get total duration of a practice plan
 */
export function calculatePlanDuration(blocks: PracticeBlock[]): number {
  return blocks.reduce((total, block) => total + block.duration_minutes, 0);
}
