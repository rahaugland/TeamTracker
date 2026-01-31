import { describe, it, expect, beforeEach } from 'vitest';
import { create, type StoreApi } from 'zustand';
import { createTeamSlice, type TeamSlice } from './teamSlice';

type TeamStore = ReturnType<typeof create<TeamSlice>>;

describe('teamSlice', () => {
  let store: TeamStore;

  beforeEach(() => {
    store = create<TeamSlice>()(createTeamSlice);
  });

  describe('setTeams', () => {
    it('should set teams', () => {
      const teams = [
        {
          id: '1',
          name: 'Team A',
          seasonId: 's1',
          seasonName: 'Fall 2024',
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: 'Team B',
          seasonId: 's1',
          seasonName: 'Fall 2024',
          createdAt: '2024-01-02',
        },
      ];

      store.getState().setTeams(teams);
      expect(store.getState().teams).toEqual(teams);
    });
  });

  describe('addTeam', () => {
    it('should add a team', () => {
      const team = {
        id: '1',
        name: 'New Team',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-01',
      };

      store.getState().addTeam(team);
      expect(store.getState().teams).toHaveLength(1);
      expect(store.getState().teams[0]).toEqual(team);
    });

    it('should add multiple teams', () => {
      store.getState().addTeam({
        id: '1',
        name: 'Team 1',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-01',
      });

      store.getState().addTeam({
        id: '2',
        name: 'Team 2',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-02',
      });

      expect(store.getState().teams).toHaveLength(2);
    });
  });

  describe('updateTeam', () => {
    it('should update a team', () => {
      const team = {
        id: '1',
        name: 'Original Name',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-01',
      };

      store.getState().addTeam(team);
      store.getState().updateTeam('1', { name: 'Updated Name' });

      expect(store.getState().teams[0].name).toBe('Updated Name');
      expect(store.getState().teams[0].id).toBe('1');
    });

    it('should not affect other teams', () => {
      store.getState().setTeams([
        {
          id: '1',
          name: 'Team 1',
          seasonId: 's1',
          seasonName: 'Fall 2024',
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: 'Team 2',
          seasonId: 's1',
          seasonName: 'Fall 2024',
          createdAt: '2024-01-02',
        },
      ]);

      store.getState().updateTeam('1', { name: 'Updated Team 1' });

      expect(store.getState().teams[0].name).toBe('Updated Team 1');
      expect(store.getState().teams[1].name).toBe('Team 2');
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team', () => {
      const team = {
        id: '1',
        name: 'Team to Delete',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-01',
      };

      store.getState().addTeam(team);
      expect(store.getState().teams).toHaveLength(1);

      store.getState().deleteTeam('1');
      expect(store.getState().teams).toHaveLength(0);
    });

    it('should clear active team if deleted', () => {
      const team = {
        id: '1',
        name: 'Active Team',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-01',
      };

      store.getState().addTeam(team);
      store.getState().setActiveTeam('1');
      expect(store.getState().activeTeamId).toBe('1');

      store.getState().deleteTeam('1');
      expect(store.getState().activeTeamId).toBeNull();
    });
  });

  describe('activeTeam', () => {
    it('should set and get active team', () => {
      const team = {
        id: '1',
        name: 'Active Team',
        seasonId: 's1',
        seasonName: 'Fall 2024',
        createdAt: '2024-01-01',
      };

      store.getState().addTeam(team);
      store.getState().setActiveTeam('1');

      expect(store.getState().activeTeamId).toBe('1');
      expect(store.getState().getActiveTeam()).toEqual(team);
    });

    it('should return null for invalid active team', () => {
      store.getState().setActiveTeam('nonexistent');
      expect(store.getState().getActiveTeam()).toBeNull();
    });
  });

  describe('loading and error states', () => {
    it('should set loading state', () => {
      store.getState().setLoading(true);
      expect(store.getState().isLoading).toBe(true);

      store.getState().setLoading(false);
      expect(store.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      store.getState().setError('Test error');
      expect(store.getState().error).toBe('Test error');

      store.getState().setError(null);
      expect(store.getState().error).toBeNull();
    });
  });
});
