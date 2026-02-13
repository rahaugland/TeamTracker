import { supabase } from '@/lib/supabase';
import type { CoachNote } from '@/types/database.types';

/**
 * Coach notes service
 * Handles all Supabase operations for private coach notes
 */

export interface CreateCoachNoteInput {
  player_id: string;
  author_id: string;
  content: string;
  tags?: string[];
}

export interface UpdateCoachNoteInput {
  content?: string;
  tags?: string[];
}

export interface CoachNoteWithAuthor extends CoachNote {
  author: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Get all notes for a specific player
 */
export async function getPlayerNotes(playerId: string): Promise<CoachNoteWithAuthor[]> {
  // Skip Supabase query for temp IDs (player not yet synced)
  if (playerId.startsWith('temp_')) return [];

  const { data, error } = await supabase
    .from('coach_notes')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coach notes:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single note by ID
 */
export async function getCoachNote(id: string): Promise<CoachNoteWithAuthor | null> {
  const { data, error } = await supabase
    .from('coach_notes')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching coach note:', error);
    throw error;
  }

  return data;
}

/**
 * Get notes by author
 */
export async function getNotesByAuthor(authorId: string): Promise<CoachNoteWithAuthor[]> {
  const { data, error } = await supabase
    .from('coach_notes')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching author notes:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new coach note
 */
export async function createCoachNote(input: CreateCoachNoteInput): Promise<CoachNote> {
  const { data, error } = await supabase
    .from('coach_notes')
    .insert({
      player_id: input.player_id,
      author_id: input.author_id,
      content: input.content,
      tags: input.tags || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coach note:', error);
    throw error;
  }

  return data;
}

/**
 * Update a coach note
 */
export async function updateCoachNote(
  id: string,
  input: UpdateCoachNoteInput
): Promise<CoachNote> {
  const { data, error } = await supabase
    .from('coach_notes')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating coach note:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a coach note
 */
export async function deleteCoachNote(id: string): Promise<void> {
  const { error } = await supabase.from('coach_notes').delete().eq('id', id);

  if (error) {
    console.error('Error deleting coach note:', error);
    throw error;
  }
}

/**
 * Search notes by content or tags
 */
export async function searchNotes(
  query: string,
  playerId?: string
): Promise<CoachNoteWithAuthor[]> {
  let dbQuery = supabase
    .from('coach_notes')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .or(`content.ilike.%${query}%,tags.cs.{${query}}`);

  if (playerId) {
    dbQuery = dbQuery.eq('player_id', playerId);
  }

  const { data, error } = await dbQuery.order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching notes:', error);
    throw error;
  }

  return data || [];
}
