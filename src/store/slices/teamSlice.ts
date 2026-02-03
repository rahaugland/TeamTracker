import { StateCreator } from 'zustand';

/**
 * Team entity based on SPEC.md
 */
export interface Team {
  id: string;
  name: string;
  season_id: string;
  season?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Team slice state interface
 */
export interface TeamSlice {
  teams: Team[];
  activeTeamId: string | null;
  isLoading: boolean;
  error: string | null;

  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  setActiveTeam: (teamId: string | null) => void;
  getActiveTeam: () => Team | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Team slice creator
 * Manages teams and active team selection
 */
export const createTeamSlice: StateCreator<TeamSlice, [], [], TeamSlice> = (set, get) => ({
  teams: [],
  activeTeamId: null,
  isLoading: false,
  error: null,

  setTeams: (teams) => set({ teams }),

  addTeam: (team) =>
    set((state) => ({
      teams: [...state.teams, team],
    })),

  updateTeam: (id, updates) =>
    set((state) => ({
      teams: state.teams.map((team) => (team.id === id ? { ...team, ...updates } : team)),
    })),

  deleteTeam: (id) =>
    set((state) => ({
      teams: state.teams.filter((team) => team.id !== id),
      activeTeamId: state.activeTeamId === id ? null : state.activeTeamId,
    })),

  setActiveTeam: (teamId) => set({ activeTeamId: teamId }),

  getActiveTeam: () => {
    const { teams, activeTeamId } = get();
    return teams.find((team) => team.id === activeTeamId) || null;
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
});
