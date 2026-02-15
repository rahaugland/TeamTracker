import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/store';
import { supabase } from '@/lib/supabase';
import { getPlayers, getPlayer, type PlayerWithMemberships } from '@/services/players.service';
import { isOnline, subscribeSyncStatus } from '@/services/sync.service';

interface PlayerContextValue {
  player: PlayerWithMemberships | null;
  teamIds: string[];
  isLoading: boolean;
  hasActiveTeams: boolean;
  hasPendingTeams: boolean;
  refreshPlayer: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerWithMemberships | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlayer = useCallback(async () => {
    if (!user?.id) {
      setPlayer(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // When online, query Supabase directly for fresh data
      // This avoids stale IndexedDB reads (race with sync, approval not yet synced, etc.)
      if (isOnline()) {
        const { data, error } = await supabase
          .from('players')
          .select('*, team_memberships(*, team:teams(id, name, season_id))')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setPlayer({
            ...data,
            team_memberships: (data.team_memberships || []).filter((tm: any) => tm.team),
          } as PlayerWithMemberships);
          return;
        }
      }

      // Fallback: read from IndexedDB (offline or Supabase query failed)
      const players = await getPlayers();
      const basicPlayer = players.find((p) => p.user_id === user.id);
      if (!basicPlayer) {
        setPlayer(null);
        return;
      }

      const playerRecord = await getPlayer(basicPlayer.id);
      setPlayer(playerRecord);
    } catch (error) {
      console.error('Error loading player context:', error);
      // Last-resort fallback to IndexedDB
      try {
        const players = await getPlayers();
        const basicPlayer = players.find((p) => p.user_id === user.id);
        if (basicPlayer) {
          setPlayer(await getPlayer(basicPlayer.id));
        } else {
          setPlayer(null);
        }
      } catch {
        setPlayer(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  // Re-read when sync completes (handles coach approving while player is online)
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((status) => {
      if (status === 'idle') {
        loadPlayer();
      }
    });
    return unsubscribe;
  }, [loadPlayer]);

  const activeMemberships = player?.team_memberships?.filter(
    (tm) => tm.status === 'active' || !tm.status
  ) || [];
  const teamIds = activeMemberships.map((tm) => tm.team_id);
  const hasActiveTeams = teamIds.length > 0;

  const pendingMemberships = player?.team_memberships?.filter(
    (tm) => tm.status === 'pending'
  ) || [];
  const hasPendingTeams = pendingMemberships.length > 0;

  return (
    <PlayerContext.Provider
      value={{ player, teamIds, isLoading, hasActiveTeams, hasPendingTeams, refreshPlayer: loadPlayer }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayerContext must be used within a PlayerContextProvider');
  }
  return ctx;
}
