import { StateCreator } from 'zustand';
import { PlayerPosition } from '@/lib/validations/player';

/**
 * Player entity based on SPEC.md
 */
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  positions: PlayerPosition[];
  photo_url?: string;
  user_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Player slice state interface
 */
export interface PlayerSlice {
  players: Player[];
  selectedPlayerId: string | null;
  isLoading: boolean;
  error: string | null;

  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  setSelectedPlayer: (playerId: string | null) => void;
  getSelectedPlayer: () => Player | null;
  getPlayersByTeam: (teamId: string) => Player[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Player slice creator
 * Manages player roster and selection
 */
export const createPlayerSlice: StateCreator<PlayerSlice, [], [], PlayerSlice> = (set, get) => ({
  players: [],
  selectedPlayerId: null,
  isLoading: false,
  error: null,

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

  updatePlayer: (id, updates) =>
    set((state) => ({
      players: state.players.map((player) => (player.id === id ? { ...player, ...updates } : player)),
    })),

  deletePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((player) => player.id !== id),
      selectedPlayerId: state.selectedPlayerId === id ? null : state.selectedPlayerId,
    })),

  setSelectedPlayer: (playerId) => set({ selectedPlayerId: playerId }),

  getSelectedPlayer: () => {
    const { players, selectedPlayerId } = get();
    return players.find((player) => player.id === selectedPlayerId) || null;
  },

  getPlayersByTeam: (_teamId: string) => {
    // TODO: Implement team membership filtering when we have the data structure
    // For now, return all players
    const { players } = get();
    return players;
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
});
