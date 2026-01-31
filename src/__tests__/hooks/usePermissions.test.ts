import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getPermissionsForRole, usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/types/database.types';

// Mock the store
vi.mock('@/store', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/store';

describe('Permissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPermissionsForRole', () => {
    describe('Head Coach Permissions', () => {
      const permissions = getPermissionsForRole('head_coach');

      it('should have full team management permissions', () => {
        expect(permissions.canCreateTeam).toBe(true);
        expect(permissions.canEditTeam).toBe(true);
        expect(permissions.canDeleteTeam).toBe(true);
        expect(permissions.canViewTeam).toBe(true);
        expect(permissions.canManageTeamInvites).toBe(true);
      });

      it('should have full user management permissions', () => {
        expect(permissions.canViewUsers).toBe(true);
        expect(permissions.canChangeUserRoles).toBe(true);
        expect(permissions.canRemoveUsers).toBe(true);
      });

      it('should have full player management permissions', () => {
        expect(permissions.canCreatePlayer).toBe(true);
        expect(permissions.canEditPlayer).toBe(true);
        expect(permissions.canDeletePlayer).toBe(true);
        expect(permissions.canViewPlayer).toBe(true);
        expect(permissions.canManageRoster).toBe(true);
      });

      it('should have full event management permissions', () => {
        expect(permissions.canCreateEvent).toBe(true);
        expect(permissions.canEditEvent).toBe(true);
        expect(permissions.canDeleteEvent).toBe(true);
        expect(permissions.canViewEvent).toBe(true);
      });

      it('should have full drill and practice plan permissions', () => {
        expect(permissions.canCreateDrill).toBe(true);
        expect(permissions.canEditDrill).toBe(true);
        expect(permissions.canDeleteDrill).toBe(true);
        expect(permissions.canViewDrill).toBe(true);
        expect(permissions.canCreatePracticePlan).toBe(true);
        expect(permissions.canEditPracticePlan).toBe(true);
        expect(permissions.canDeletePracticePlan).toBe(true);
        expect(permissions.canViewPracticePlan).toBe(true);
      });

      it('should have full attendance and stats permissions', () => {
        expect(permissions.canMarkAttendance).toBe(true);
        expect(permissions.canViewAttendance).toBe(true);
        expect(permissions.canRSVP).toBe(true);
        expect(permissions.canViewRSVPs).toBe(true);
        expect(permissions.canRecordStats).toBe(true);
        expect(permissions.canViewStats).toBe(true);
        expect(permissions.canAddCoachNotes).toBe(true);
        expect(permissions.canViewCoachNotes).toBe(true);
      });

      it('should have full season management permissions', () => {
        expect(permissions.canCreateSeason).toBe(true);
        expect(permissions.canEditSeason).toBe(true);
        expect(permissions.canDeleteSeason).toBe(true);
        expect(permissions.canViewSeason).toBe(true);
      });
    });

    describe('Assistant Coach Permissions', () => {
      const permissions = getPermissionsForRole('assistant_coach');

      it('should have limited team management permissions', () => {
        expect(permissions.canCreateTeam).toBe(false);
        expect(permissions.canEditTeam).toBe(true);
        expect(permissions.canDeleteTeam).toBe(false);
        expect(permissions.canViewTeam).toBe(true);
        expect(permissions.canManageTeamInvites).toBe(true);
      });

      it('should have limited user management permissions', () => {
        expect(permissions.canViewUsers).toBe(true);
        expect(permissions.canChangeUserRoles).toBe(false);
        expect(permissions.canRemoveUsers).toBe(false);
      });

      it('should have limited player management permissions', () => {
        expect(permissions.canCreatePlayer).toBe(true);
        expect(permissions.canEditPlayer).toBe(true);
        expect(permissions.canDeletePlayer).toBe(false);
        expect(permissions.canViewPlayer).toBe(true);
        expect(permissions.canManageRoster).toBe(true);
      });

      it('should have full event management permissions', () => {
        expect(permissions.canCreateEvent).toBe(true);
        expect(permissions.canEditEvent).toBe(true);
        expect(permissions.canDeleteEvent).toBe(true);
        expect(permissions.canViewEvent).toBe(true);
      });

      it('should have full drill and practice plan permissions', () => {
        expect(permissions.canCreateDrill).toBe(true);
        expect(permissions.canEditDrill).toBe(true);
        expect(permissions.canDeleteDrill).toBe(true);
        expect(permissions.canViewDrill).toBe(true);
        expect(permissions.canCreatePracticePlan).toBe(true);
        expect(permissions.canEditPracticePlan).toBe(true);
        expect(permissions.canDeletePracticePlan).toBe(true);
        expect(permissions.canViewPracticePlan).toBe(true);
      });

      it('should NOT have season management permissions', () => {
        expect(permissions.canCreateSeason).toBe(false);
        expect(permissions.canEditSeason).toBe(false);
        expect(permissions.canDeleteSeason).toBe(false);
        expect(permissions.canViewSeason).toBe(true);
      });

      it('should have full coaching permissions', () => {
        expect(permissions.canMarkAttendance).toBe(true);
        expect(permissions.canViewAttendance).toBe(true);
        expect(permissions.canRecordStats).toBe(true);
        expect(permissions.canViewStats).toBe(true);
        expect(permissions.canAddCoachNotes).toBe(true);
        expect(permissions.canViewCoachNotes).toBe(true);
      });
    });

    describe('Player Permissions', () => {
      const permissions = getPermissionsForRole('player');

      it('should have NO team management permissions', () => {
        expect(permissions.canCreateTeam).toBe(false);
        expect(permissions.canEditTeam).toBe(false);
        expect(permissions.canDeleteTeam).toBe(false);
        expect(permissions.canViewTeam).toBe(true);
        expect(permissions.canManageTeamInvites).toBe(false);
      });

      it('should have NO user management permissions', () => {
        expect(permissions.canViewUsers).toBe(false);
        expect(permissions.canChangeUserRoles).toBe(false);
        expect(permissions.canRemoveUsers).toBe(false);
      });

      it('should have NO player management permissions', () => {
        expect(permissions.canCreatePlayer).toBe(false);
        expect(permissions.canEditPlayer).toBe(false);
        expect(permissions.canDeletePlayer).toBe(false);
        expect(permissions.canViewPlayer).toBe(true);
        expect(permissions.canManageRoster).toBe(false);
      });

      it('should have view-only event permissions', () => {
        expect(permissions.canCreateEvent).toBe(false);
        expect(permissions.canEditEvent).toBe(false);
        expect(permissions.canDeleteEvent).toBe(false);
        expect(permissions.canViewEvent).toBe(true);
      });

      it('should have view-only drill permissions', () => {
        expect(permissions.canCreateDrill).toBe(false);
        expect(permissions.canEditDrill).toBe(false);
        expect(permissions.canDeleteDrill).toBe(false);
        expect(permissions.canViewDrill).toBe(true);
      });

      it('should be able to RSVP and view attendance', () => {
        expect(permissions.canMarkAttendance).toBe(false);
        expect(permissions.canViewAttendance).toBe(true);
        expect(permissions.canRSVP).toBe(true);
        expect(permissions.canViewRSVPs).toBe(true);
      });

      it('should have view-only stats permissions', () => {
        expect(permissions.canRecordStats).toBe(false);
        expect(permissions.canViewStats).toBe(true);
      });

      it('should NOT see coach notes', () => {
        expect(permissions.canAddCoachNotes).toBe(false);
        expect(permissions.canViewCoachNotes).toBe(false);
      });

      it('should have NO practice plan access', () => {
        expect(permissions.canCreatePracticePlan).toBe(false);
        expect(permissions.canEditPracticePlan).toBe(false);
        expect(permissions.canDeletePracticePlan).toBe(false);
        expect(permissions.canViewPracticePlan).toBe(true);
      });
    });

    describe('Parent Permissions', () => {
      const permissions = getPermissionsForRole('parent');

      it('should have NO management permissions', () => {
        expect(permissions.canCreateTeam).toBe(false);
        expect(permissions.canEditTeam).toBe(false);
        expect(permissions.canDeleteTeam).toBe(false);
        expect(permissions.canCreatePlayer).toBe(false);
        expect(permissions.canEditPlayer).toBe(false);
        expect(permissions.canDeletePlayer).toBe(false);
        expect(permissions.canCreateEvent).toBe(false);
        expect(permissions.canEditEvent).toBe(false);
        expect(permissions.canDeleteEvent).toBe(false);
      });

      it('should have basic viewing permissions', () => {
        expect(permissions.canViewTeam).toBe(true);
        expect(permissions.canViewPlayer).toBe(true);
        expect(permissions.canViewEvent).toBe(true);
        expect(permissions.canViewAttendance).toBe(true);
        expect(permissions.canViewStats).toBe(true);
      });

      it('should be able to RSVP for linked players', () => {
        expect(permissions.canRSVP).toBe(true);
        expect(permissions.canViewRSVPs).toBe(true);
      });

      it('should NOT see drills or practice plans', () => {
        expect(permissions.canViewDrill).toBe(false);
        expect(permissions.canViewPracticePlan).toBe(false);
      });

      it('should NOT see coach notes', () => {
        expect(permissions.canAddCoachNotes).toBe(false);
        expect(permissions.canViewCoachNotes).toBe(false);
      });
    });

    describe('Guest Permissions', () => {
      const permissions = getPermissionsForRole(null);

      it('should have NO permissions at all', () => {
        const allPermissions = Object.keys(permissions);
        const permissionValues = allPermissions.map(key => permissions[key as keyof typeof permissions]);

        expect(permissionValues.every(value => value === false)).toBe(true);
      });

      it('should deny all critical operations', () => {
        expect(permissions.canCreateTeam).toBe(false);
        expect(permissions.canViewTeam).toBe(false);
        expect(permissions.canCreatePlayer).toBe(false);
        expect(permissions.canViewPlayer).toBe(false);
        expect(permissions.canCreateEvent).toBe(false);
        expect(permissions.canViewEvent).toBe(false);
        expect(permissions.canRSVP).toBe(false);
        expect(permissions.canViewAttendance).toBe(false);
      });
    });
  });

  describe('usePermissions hook', () => {
    it('should return permissions for head coach', () => {
      (useAuth as any).mockReturnValue({
        user: { role: 'head_coach' as UserRole },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('head_coach');
      expect(result.current.isCoach).toBe(true);
      expect(result.current.canCreateTeam).toBe(true);
      expect(result.current.canDeleteTeam).toBe(true);
    });

    it('should return permissions for assistant coach', () => {
      (useAuth as any).mockReturnValue({
        user: { role: 'assistant_coach' as UserRole },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('assistant_coach');
      expect(result.current.isCoach).toBe(true);
      expect(result.current.canCreateTeam).toBe(false);
      expect(result.current.canDeleteTeam).toBe(false);
      expect(result.current.canEditTeam).toBe(true);
    });

    it('should return permissions for player', () => {
      (useAuth as any).mockReturnValue({
        user: { role: 'player' as UserRole },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('player');
      expect(result.current.isCoach).toBe(false);
      expect(result.current.canViewTeam).toBe(true);
      expect(result.current.canRSVP).toBe(true);
      expect(result.current.canCreateEvent).toBe(false);
    });

    it('should return permissions for parent', () => {
      (useAuth as any).mockReturnValue({
        user: { role: 'parent' as UserRole },
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('parent');
      expect(result.current.isCoach).toBe(false);
      expect(result.current.canViewTeam).toBe(true);
      expect(result.current.canRSVP).toBe(true);
      expect(result.current.canViewDrill).toBe(false);
    });

    it('should return guest permissions when no user', () => {
      (useAuth as any).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBeNull();
      expect(result.current.isCoach).toBe(false);
      expect(result.current.canViewTeam).toBe(false);
      expect(result.current.canViewEvent).toBe(false);
    });

    it('should identify coaches correctly', () => {
      (useAuth as any).mockReturnValue({
        user: { role: 'head_coach' as UserRole },
      });

      let { result } = renderHook(() => usePermissions());
      expect(result.current.isCoach).toBe(true);

      (useAuth as any).mockReturnValue({
        user: { role: 'assistant_coach' as UserRole },
      });

      result = renderHook(() => usePermissions()).result;
      expect(result.current.isCoach).toBe(true);

      (useAuth as any).mockReturnValue({
        user: { role: 'player' as UserRole },
      });

      result = renderHook(() => usePermissions()).result;
      expect(result.current.isCoach).toBe(false);

      (useAuth as any).mockReturnValue({
        user: { role: 'parent' as UserRole },
      });

      result = renderHook(() => usePermissions()).result;
      expect(result.current.isCoach).toBe(false);
    });
  });

  describe('Permission Consistency', () => {
    it('should ensure view permissions when edit/delete is granted', () => {
      const roles: UserRole[] = ['head_coach', 'assistant_coach', 'player', 'parent'];

      roles.forEach(role => {
        const perms = getPermissionsForRole(role);

        // If can edit team, should be able to view team
        if (perms.canEditTeam || perms.canDeleteTeam) {
          expect(perms.canViewTeam).toBe(true);
        }

        // If can edit player, should be able to view player
        if (perms.canEditPlayer || perms.canDeletePlayer) {
          expect(perms.canViewPlayer).toBe(true);
        }

        // If can edit event, should be able to view event
        if (perms.canEditEvent || perms.canDeleteEvent) {
          expect(perms.canViewEvent).toBe(true);
        }

        // If can mark attendance, should be able to view attendance
        if (perms.canMarkAttendance) {
          expect(perms.canViewAttendance).toBe(true);
        }

        // If can record stats, should be able to view stats
        if (perms.canRecordStats) {
          expect(perms.canViewStats).toBe(true);
        }
      });
    });

    it('should maintain permission hierarchy (head coach >= assistant coach)', () => {
      const headCoach = getPermissionsForRole('head_coach');
      const assistantCoach = getPermissionsForRole('assistant_coach');

      const permissions = Object.keys(headCoach) as Array<keyof typeof headCoach>;

      permissions.forEach(permission => {
        // If assistant coach has a permission, head coach must also have it
        if (assistantCoach[permission]) {
          expect(headCoach[permission]).toBe(true);
        }
      });
    });

    it('should maintain permission hierarchy (coach >= player)', () => {
      const headCoach = getPermissionsForRole('head_coach');
      const player = getPermissionsForRole('player');

      const permissions = Object.keys(player) as Array<keyof typeof player>;

      permissions.forEach(permission => {
        // If player has a permission, head coach must also have it
        if (player[permission]) {
          expect(headCoach[permission]).toBe(true);
        }
      });
    });
  });
});
