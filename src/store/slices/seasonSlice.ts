import { StateCreator } from 'zustand';
import type { Season } from '@/types/database.types';

/**
 * Season slice state interface
 */
export interface SeasonSlice {
  seasons: Season[];
  activeSeason: Season | null;
  isLoading: boolean;
  error: string | null;

  setSeasons: (seasons: Season[]) => void;
  addSeason: (season: Season) => void;
  updateSeason: (id: string, updates: Partial<Season>) => void;
  deleteSeason: (id: string) => void;
  setActiveSeason: (season: Season | null) => void;
  getSeasonById: (id: string) => Season | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Season slice creator
 * Manages seasons and active season selection
 */
export const createSeasonSlice: StateCreator<SeasonSlice, [], [], SeasonSlice> = (
  set,
  get
) => ({
  seasons: [],
  activeSeason: null,
  isLoading: false,
  error: null,

  setSeasons: (seasons) => set({ seasons }),

  addSeason: (season) =>
    set((state) => ({
      seasons: [...state.seasons, season],
    })),

  updateSeason: (id, updates) =>
    set((state) => ({
      seasons: state.seasons.map((season) =>
        season.id === id ? { ...season, ...updates } : season
      ),
      activeSeason:
        state.activeSeason?.id === id
          ? { ...state.activeSeason, ...updates }
          : state.activeSeason,
    })),

  deleteSeason: (id) =>
    set((state) => ({
      seasons: state.seasons.filter((season) => season.id !== id),
      activeSeason: state.activeSeason?.id === id ? null : state.activeSeason,
    })),

  setActiveSeason: (season) => set({ activeSeason: season }),

  getSeasonById: (id) => {
    const { seasons } = get();
    return seasons.find((season) => season.id === id) || null;
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
});
