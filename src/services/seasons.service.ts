import { supabase } from '@/lib/supabase';
import type { Season } from '@/types/database.types';

/**
 * Season service
 * Handles all Supabase operations for seasons
 */

export interface CreateSeasonInput {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface UpdateSeasonInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  archived?: boolean;
}

/**
 * Get all seasons (non-archived by default)
 */
export async function getSeasons(includeArchived = false): Promise<Season[]> {
  let query = supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false });

  if (!includeArchived) {
    query = query.eq('archived', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single season by ID
 */
export async function getSeason(id: string): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching season:', error);
    throw error;
  }

  return data;
}

/**
 * Get the active season
 */
export async function getActiveSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .eq('archived', false)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching active season:', error);
    throw error;
  }

  return data || null;
}

/**
 * Create a new season
 */
export async function createSeason(input: CreateSeasonInput): Promise<Season> {
  const { data, error } = await supabase
    .from('seasons')
    .insert({
      name: input.name,
      start_date: input.start_date,
      end_date: input.end_date,
      is_active: input.is_active ?? false,
      archived: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating season:', error);
    throw error;
  }

  return data;
}

/**
 * Update a season
 */
export async function updateSeason(
  id: string,
  input: UpdateSeasonInput
): Promise<Season> {
  const { data, error } = await supabase
    .from('seasons')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating season:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a season
 * Note: This will cascade delete all teams and related data
 */
export async function deleteSeason(id: string): Promise<void> {
  const { error } = await supabase.from('seasons').delete().eq('id', id);

  if (error) {
    console.error('Error deleting season:', error);
    throw error;
  }
}

/**
 * Archive a season (soft delete)
 */
export async function archiveSeason(id: string): Promise<Season> {
  return updateSeason(id, { archived: true, is_active: false });
}

/**
 * Set a season as active (and deactivate others)
 */
export async function setActiveSeason(id: string): Promise<Season> {
  // First, deactivate all other seasons
  const { error: deactivateError } = await supabase
    .from('seasons')
    .update({ is_active: false })
    .neq('id', id);

  if (deactivateError) {
    console.error('Error deactivating other seasons:', deactivateError);
    throw deactivateError;
  }

  // Then activate the selected season
  return updateSeason(id, { is_active: true });
}
