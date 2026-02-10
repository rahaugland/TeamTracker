import { supabase } from '@/lib/supabase';
import type { ClaimToken } from '@/types/database.types';

/**
 * Claim service
 * Handles token generation for coaches and player claiming flow.
 * Online-only — no Dexie/offline support needed.
 */

const TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate a 32-character hex token client-side
 */
function generateHexToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface ClaimTokenDetails {
  player: { id: string; name: string; positions: string[]; photo_url?: string };
  team: { id: string; name: string };
  expiresAt: string;
  isExpired: boolean;
  isClaimed: boolean;
}

/**
 * Generate a claim token for an unclaimed player.
 * If an active (unexpired, unclaimed) token already exists, returns it.
 */
export async function generateClaimToken(
  playerId: string,
  teamId: string
): Promise<{ token: string; expiresAt: string }> {
  // Verify the player has no user_id (unclaimed)
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('user_id')
    .eq('id', playerId)
    .single();

  if (playerError) throw playerError;
  if (player.user_id) {
    throw new Error('Player is already linked to a user account');
  }

  // Check for an existing active token
  const { data: existing, error: existingError } = await supabase
    .from('player_claim_tokens')
    .select('token, expires_at')
    .eq('player_id', playerId)
    .is('claimed_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    return { token: existing.token, expiresAt: existing.expires_at };
  }

  // Generate new token
  const token = generateHexToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: insertError } = await supabase
    .from('player_claim_tokens')
    .insert({
      token,
      player_id: playerId,
      team_id: teamId,
      created_by: (await supabase.auth.getUser()).data.user!.id,
      expires_at: expiresAt,
    });

  if (insertError) throw insertError;

  return { token, expiresAt };
}

/**
 * Get claim token details for the claim page.
 * Uses a SECURITY DEFINER RPC so unauthenticated users can view the claim page.
 * Returns player and team display info, or null if token does not exist.
 */
export async function getClaimTokenDetails(
  token: string
): Promise<ClaimTokenDetails | null> {
  const { data, error } = await supabase.rpc('get_claim_token_details', {
    p_token: token,
  });

  if (error) throw error;
  if (!data || !data.player || !data.team) return null;

  return {
    player: {
      id: data.player.id,
      name: data.player.name,
      positions: data.player.positions,
      photo_url: data.player.photo_url,
    },
    team: {
      id: data.team.id,
      name: data.team.name,
    },
    expiresAt: data.expires_at,
    isExpired: new Date(data.expires_at) < new Date(),
    isClaimed: data.claimed_at !== null,
  };
}

/**
 * Claim a player by calling the database RPC function.
 * Atomically validates the token, links the player, and marks the token as claimed.
 */
export async function claimPlayer(
  token: string
): Promise<{ playerId: string; teamId: string }> {
  const { data, error } = await supabase.rpc('claim_player', {
    p_token: token,
  });

  if (error) throw error;

  const row = data?.[0] ?? data;
  return { playerId: row.player_id, teamId: row.team_id };
}

/**
 * Revoke a claim token (coach cancels the invite).
 */
export async function revokeClaimToken(tokenId: string): Promise<void> {
  const { error } = await supabase
    .from('player_claim_tokens')
    .delete()
    .eq('id', tokenId);

  if (error) throw error;
}

/**
 * Get all active (unexpired, unclaimed) claim tokens for a team.
 * Includes the player name for display in the coach panel.
 */
export async function getTeamClaimTokens(
  teamId: string
): Promise<(ClaimToken & { player_name: string })[]> {
  const { data, error } = await supabase
    .from('player_claim_tokens')
    .select(`
      *,
      player:players(name)
    `)
    .eq('team_id', teamId)
    .is('claimed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const { player, ...token } = row;
    return { ...token, player_name: player?.name ?? '' };
  });
}

/**
 * Build the full claim URL from a token string.
 */
export function buildClaimUrl(token: string): string {
  return `${window.location.origin}/claim/${token}`;
}
