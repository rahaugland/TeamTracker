import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/store';
import { getPlayers, getPlayer, type PlayerWithMemberships } from '@/services/players.service';

interface PlayerContextValue {
  player: PlayerWithMemberships | null;
  teamIds: string[];
  isLoading: boolean;
  hasActiveTeams: boolean;
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
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  const activeMemberships = player?.team_memberships?.filter(
    (tm) => tm.status === 'active' || !tm.status
  ) || [];
  const teamIds = activeMemberships.map((tm) => tm.team_id);
  const hasActiveTeams = teamIds.length > 0;

  return (
    <PlayerContext.Provider
      value={{ player, teamIds, isLoading, hasActiveTeams, refreshPlayer: loadPlayer }}
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
