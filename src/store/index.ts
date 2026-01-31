import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createTeamSlice, type TeamSlice } from './slices/teamSlice';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createSeasonSlice, type SeasonSlice } from './slices/seasonSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

/**
 * Combined store type
 */
export type AppStore = AuthSlice & TeamSlice & PlayerSlice & SeasonSlice & UISlice;

/**
 * Main application store
 * Combines all slices with persist middleware
 */
export const useStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createTeamSlice(...args),
      ...createPlayerSlice(...args),
      ...createSeasonSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: 'teamtracker-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these parts of the state
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        language: state.language,
        activeTeamId: state.activeTeamId,
        activeSeason: state.activeSeason,
        // Don't persist loading states or temporary UI state
      }),
    }
  )
);

/**
 * Typed hooks for accessing specific slices
 * These provide better intellisense and type safety
 */

// Auth hooks - useShallow prevents infinite re-renders
export const useAuth = () =>
  useStore(
    useShallow((state) => ({
      user: state.user,
      session: state.session,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      setUser: state.setUser,
      setSession: state.setSession,
      signInWithGoogle: state.signInWithGoogle,
      signOut: state.signOut,
      updateUserRole: state.updateUserRole,
      syncSession: state.syncSession,
    }))
  );

// Team hooks - useShallow prevents infinite re-renders
export const useTeams = () =>
  useStore(
    useShallow((state) => ({
      teams: state.teams,
      activeTeamId: state.activeTeamId,
      isLoading: state.isLoading,
      setTeams: state.setTeams,
      addTeam: state.addTeam,
      updateTeam: state.updateTeam,
      deleteTeam: state.deleteTeam,
      setActiveTeam: state.setActiveTeam,
      getActiveTeam: state.getActiveTeam,
    }))
  );

// Player hooks - useShallow prevents infinite re-renders
export const usePlayers = () =>
  useStore(
    useShallow((state) => ({
      players: state.players,
      selectedPlayerId: state.selectedPlayerId,
      isLoading: state.isLoading,
      setPlayers: state.setPlayers,
      addPlayer: state.addPlayer,
      updatePlayer: state.updatePlayer,
      deletePlayer: state.deletePlayer,
      setSelectedPlayer: state.setSelectedPlayer,
      getSelectedPlayer: state.getSelectedPlayer,
      getPlayersByTeam: state.getPlayersByTeam,
    }))
  );

// Season hooks - useShallow prevents infinite re-renders
export const useSeasons = () =>
  useStore(
    useShallow((state) => ({
      seasons: state.seasons,
      activeSeason: state.activeSeason,
      isLoading: state.isLoading,
      error: state.error,
      setSeasons: state.setSeasons,
      addSeason: state.addSeason,
      updateSeason: state.updateSeason,
      deleteSeason: state.deleteSeason,
      setActiveSeason: state.setActiveSeason,
      getSeasonById: state.getSeasonById,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  );

// UI hooks - useShallow prevents infinite re-renders
export const useUI = () =>
  useStore(
    useShallow((state) => ({
      theme: state.theme,
      sidebarOpen: state.sidebarOpen,
      language: state.language,
      notifications: state.notifications,
      setTheme: state.setTheme,
      toggleSidebar: state.toggleSidebar,
      setSidebarOpen: state.setSidebarOpen,
      setLanguage: state.setLanguage,
      addNotification: state.addNotification,
      removeNotification: state.removeNotification,
      clearNotifications: state.clearNotifications,
    }))
  );
