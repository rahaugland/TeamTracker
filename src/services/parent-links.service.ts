import { supabase } from '@/lib/supabase';
import type { ParentChildLink, Player } from '@/types/database.types';

/**
 * Parent-child link service
 * Handles operations for linking parents to their children (players)
 */

export interface CreateParentLinkInput {
  parent_id: string;
  child_id: string;
}

export interface LinkedPlayerWithDetails extends Player {
  link_id: string;
  team_memberships: {
    id: string;
    team_id: string;
    jersey_number?: number;
    team: {
      id: string;
      name: string;
      season_id: string;
    };
  }[];
}

/**
 * Get all players linked to a parent
 */
export async function getLinkedPlayers(parentId: string): Promise<LinkedPlayerWithDetails[]> {
  const { data, error } = await supabase
    .from('parent_child_links')
    .select(`
      id,
      child:players!parent_child_links_child_id_fkey(
        *,
        team_memberships(
          id,
          team_id,
          jersey_number,
          team:teams(
            id,
            name,
            season_id
          )
        )
      )
    `)
    .eq('parent_id', parentId);

  if (error) {
    console.error('Error fetching linked players:', error);
    throw error;
  }

  return (
    data?.map((link: any) => ({
      ...link.child,
      link_id: link.id,
    })) || []
  );
}

/**
 * Get all parents linked to a player
 */
export async function getLinkedParents(playerId: string): Promise<ParentChildLink[]> {
  const { data, error } = await supabase
    .from('parent_child_links')
    .select('*')
    .eq('child_id', playerId);

  if (error) {
    console.error('Error fetching linked parents:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a parent-child link
 */
export async function createParentLink(input: CreateParentLinkInput): Promise<ParentChildLink> {
  const { data, error } = await supabase
    .from('parent_child_links')
    .insert({
      parent_id: input.parent_id,
      child_id: input.child_id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating parent link:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a parent-child link
 */
export async function deleteParentLink(linkId: string): Promise<void> {
  const { error } = await supabase.from('parent_child_links').delete().eq('id', linkId);

  if (error) {
    console.error('Error deleting parent link:', error);
    throw error;
  }
}

/**
 * Check if a parent-child link exists
 */
export async function parentLinkExists(
  parentId: string,
  childId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_id', parentId)
    .eq('child_id', childId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking parent link:', error);
    throw error;
  }

  return !!data;
}

/**
 * Link parent to player by player's user_id
 * Useful when a parent knows their child's email/account
 */
export async function linkParentByPlayerUserId(
  parentId: string,
  playerUserId: string
): Promise<ParentChildLink> {
  // First, find the player with this user_id
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', playerUserId)
    .single();

  if (playerError) {
    console.error('Error finding player:', playerError);
    throw playerError;
  }

  if (!player) {
    throw new Error('Player not found with the provided user ID');
  }

  return createParentLink({ parent_id: parentId, child_id: player.id });
}
