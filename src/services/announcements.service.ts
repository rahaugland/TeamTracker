import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/types/database.types';

/**
 * Announcements service
 * Handles all Supabase operations for team announcements
 */

export interface CreateAnnouncementInput {
  team_id: string;
  author_id: string;
  title: string;
  content: string;
  pinned?: boolean;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: { id: string; full_name: string; avatar_url?: string };
}

/**
 * Get announcements for a specific team
 */
export async function getTeamAnnouncements(teamId: string): Promise<AnnouncementWithAuthor[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('team_id', teamId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching team announcements:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get announcements for multiple teams
 */
export async function getAnnouncementsForTeams(teamIds: string[]): Promise<AnnouncementWithAuthor[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .in('team_id', teamIds)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements for teams:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      team_id: input.team_id,
      author_id: input.author_id,
      title: input.title,
      content: input.content,
      pinned: input.pinned ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }

  return data;
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  id: string,
  input: Partial<Pick<Announcement, 'title' | 'content' | 'pinned'>>
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);

  if (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}
