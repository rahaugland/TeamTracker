import { supabase } from '@/lib/supabase';
import type { Drill, SkillTag } from '@/types/database.types';

/**
 * Drill service
 * Handles all Supabase operations for drills
 */

export interface CreateDrillInput {
  name: string;
  description: string;
  skill_tags: string[];
  custom_tags?: string[];
  progression_level: 1 | 2 | 3 | 4 | 5;
  parent_drill_id?: string;
  min_players?: number;
  max_players?: number;
  equipment_needed?: string[];
  duration_minutes?: number;
  video_url?: string;
  created_by: string;
  is_system_drill?: boolean;
}

export interface UpdateDrillInput {
  name?: string;
  description?: string;
  skill_tags?: string[];
  custom_tags?: string[];
  progression_level?: 1 | 2 | 3 | 4 | 5;
  parent_drill_id?: string;
  min_players?: number;
  max_players?: number;
  equipment_needed?: string[];
  duration_minutes?: number;
  video_url?: string;
}

export interface DrillWithProgression extends Drill {
  parent_drill?: Drill | null;
  child_drills?: Drill[];
}

/**
 * Get all drills
 */
export async function getDrills(): Promise<Drill[]> {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching drills:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single drill by ID
 */
export async function getDrill(id: string): Promise<Drill | null> {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching drill:', error);
    throw error;
  }

  return data;
}

/**
 * Get drill with progression chain (parent and children)
 */
export async function getDrillWithProgression(id: string): Promise<DrillWithProgression | null> {
  const drill = await getDrill(id);
  if (!drill) return null;

  const result: DrillWithProgression = { ...drill };

  // Get parent drill if exists
  if (drill.parent_drill_id) {
    const { data: parentData } = await supabase
      .from('drills')
      .select('*')
      .eq('id', drill.parent_drill_id)
      .single();

    result.parent_drill = parentData || null;
  }

  // Get child drills
  const { data: childrenData } = await supabase
    .from('drills')
    .select('*')
    .eq('parent_drill_id', id)
    .order('progression_level');

  result.child_drills = childrenData || [];

  return result;
}

/**
 * Get drills by skill tag
 */
export async function getDrillsBySkillTag(skillTag: SkillTag): Promise<Drill[]> {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .contains('skill_tags', [skillTag])
    .order('progression_level')
    .order('name');

  if (error) {
    console.error('Error fetching drills by skill tag:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get drills by progression level
 */
export async function getDrillsByLevel(level: 1 | 2 | 3 | 4 | 5): Promise<Drill[]> {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .eq('progression_level', level)
    .order('name');

  if (error) {
    console.error('Error fetching drills by level:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search drills by name
 */
export async function searchDrills(query: string): Promise<Drill[]> {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('name')
    .limit(20);

  if (error) {
    console.error('Error searching drills:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new drill
 */
export async function createDrill(input: CreateDrillInput): Promise<Drill> {
  const { data, error } = await supabase
    .from('drills')
    .insert({
      name: input.name,
      description: input.description,
      skill_tags: input.skill_tags,
      custom_tags: input.custom_tags || [],
      progression_level: input.progression_level,
      parent_drill_id: input.parent_drill_id,
      min_players: input.min_players,
      max_players: input.max_players,
      equipment_needed: input.equipment_needed || [],
      duration_minutes: input.duration_minutes,
      video_url: input.video_url,
      created_by: input.created_by,
      is_system_drill: input.is_system_drill || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating drill:', error);
    throw error;
  }

  return data;
}

/**
 * Update a drill
 */
export async function updateDrill(id: string, input: UpdateDrillInput): Promise<Drill> {
  const { data, error } = await supabase
    .from('drills')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating drill:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a drill
 */
export async function deleteDrill(id: string): Promise<void> {
  const { error } = await supabase.from('drills').delete().eq('id', id);

  if (error) {
    console.error('Error deleting drill:', error);
    throw error;
  }
}

/**
 * Get the progression chain for a drill (all ancestors and descendants)
 */
export async function getProgressionChain(drillId: string): Promise<{
  ancestors: Drill[];
  current: Drill | null;
  descendants: Drill[];
}> {
  const current = await getDrill(drillId);
  if (!current) {
    return { ancestors: [], current: null, descendants: [] };
  }

  const ancestors: Drill[] = [];
  const descendants: Drill[] = [];

  // Get all ancestors (parent, grandparent, etc.)
  let currentParentId = current.parent_drill_id;
  while (currentParentId) {
    const parent = await getDrill(currentParentId);
    if (!parent) break;
    ancestors.unshift(parent); // Add to beginning to maintain order
    currentParentId = parent.parent_drill_id;
  }

  // Get all descendants recursively
  const getDescendants = async (parentId: string): Promise<void> => {
    const { data } = await supabase
      .from('drills')
      .select('*')
      .eq('parent_drill_id', parentId)
      .order('progression_level');

    if (data && data.length > 0) {
      for (const child of data) {
        descendants.push(child);
        await getDescendants(child.id);
      }
    }
  };

  await getDescendants(drillId);

  return { ancestors, current, descendants };
}
