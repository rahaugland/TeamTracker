import { useAuth } from '@/store';
import type { UserRole } from '@/types/database.types';

/**
 * Permission definitions based on user roles
 *
 * Role hierarchy:
 * - head_coach: Full access to everything
 * - assistant_coach: Can manage players, events, drills, attendance. Cannot delete teams or manage other coaches
 * - player: Can view schedule, RSVP, view own stats
 * - parent: Can view schedule, RSVP for linked players
 */

export interface Permissions {
  // Team management
  canCreateTeam: boolean;
  canEditTeam: boolean;
  canDeleteTeam: boolean;
  canViewTeam: boolean;
  canManageTeamInvites: boolean;

  // User management
  canViewUsers: boolean;
  canChangeUserRoles: boolean;
  canRemoveUsers: boolean;

  // Player management
  canCreatePlayer: boolean;
  canEditPlayer: boolean;
  canDeletePlayer: boolean;
  canViewPlayer: boolean;
  canManageRoster: boolean;

  // Event management
  canCreateEvent: boolean;
  canEditEvent: boolean;
  canDeleteEvent: boolean;
  canViewEvent: boolean;

  // Drill management
  canCreateDrill: boolean;
  canEditDrill: boolean;
  canDeleteDrill: boolean;
  canViewDrill: boolean;

  // Practice plan management
  canCreatePracticePlan: boolean;
  canEditPracticePlan: boolean;
  canDeletePracticePlan: boolean;
  canViewPracticePlan: boolean;

  // Attendance and RSVP
  canMarkAttendance: boolean;
  canViewAttendance: boolean;
  canRSVP: boolean;
  canViewRSVPs: boolean;

  // Stats and notes
  canRecordStats: boolean;
  canViewStats: boolean;
  canAddCoachNotes: boolean;
  canViewCoachNotes: boolean;

  // Season management
  canCreateSeason: boolean;
  canEditSeason: boolean;
  canDeleteSeason: boolean;
  canViewSeason: boolean;

  // Membership approval
  canApproveMembers: boolean;
}

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: UserRole | null): Permissions {
  if (!role) {
    return getGuestPermissions();
  }

  switch (role) {
    case 'head_coach':
      return getHeadCoachPermissions();
    case 'assistant_coach':
      return getAssistantCoachPermissions();
    case 'player':
      return getPlayerPermissions();
    case 'parent':
      return getParentPermissions();
    default:
      return getGuestPermissions();
  }
}

function getHeadCoachPermissions(): Permissions {
  return {
    // Team management
    canCreateTeam: true,
    canEditTeam: true,
    canDeleteTeam: true,
    canViewTeam: true,
    canManageTeamInvites: true,

    // User management
    canViewUsers: true,
    canChangeUserRoles: true,
    canRemoveUsers: true,

    // Player management
    canCreatePlayer: true,
    canEditPlayer: true,
    canDeletePlayer: true,
    canViewPlayer: true,
    canManageRoster: true,

    // Event management
    canCreateEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canViewEvent: true,

    // Drill management
    canCreateDrill: true,
    canEditDrill: true,
    canDeleteDrill: true,
    canViewDrill: true,

    // Practice plan management
    canCreatePracticePlan: true,
    canEditPracticePlan: true,
    canDeletePracticePlan: true,
    canViewPracticePlan: true,

    // Attendance and RSVP
    canMarkAttendance: true,
    canViewAttendance: true,
    canRSVP: true,
    canViewRSVPs: true,

    // Stats and notes
    canRecordStats: true,
    canViewStats: true,
    canAddCoachNotes: true,
    canViewCoachNotes: true,

    // Season management
    canCreateSeason: true,
    canEditSeason: true,
    canDeleteSeason: true,
    canViewSeason: true,

    canApproveMembers: true,
  };
}

function getAssistantCoachPermissions(): Permissions {
  return {
    // Team management
    canCreateTeam: false,
    canEditTeam: true,
    canDeleteTeam: false,
    canViewTeam: true,
    canManageTeamInvites: true,

    // User management
    canViewUsers: true,
    canChangeUserRoles: false,
    canRemoveUsers: false,

    // Player management
    canCreatePlayer: true,
    canEditPlayer: true,
    canDeletePlayer: false,
    canViewPlayer: true,
    canManageRoster: true,

    // Event management
    canCreateEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canViewEvent: true,

    // Drill management
    canCreateDrill: true,
    canEditDrill: true,
    canDeleteDrill: true,
    canViewDrill: true,

    // Practice plan management
    canCreatePracticePlan: true,
    canEditPracticePlan: true,
    canDeletePracticePlan: true,
    canViewPracticePlan: true,

    // Attendance and RSVP
    canMarkAttendance: true,
    canViewAttendance: true,
    canRSVP: true,
    canViewRSVPs: true,

    // Stats and notes
    canRecordStats: true,
    canViewStats: true,
    canAddCoachNotes: true,
    canViewCoachNotes: true,

    // Season management
    canCreateSeason: false,
    canEditSeason: false,
    canDeleteSeason: false,
    canViewSeason: true,

    canApproveMembers: true,
  };
}

function getPlayerPermissions(): Permissions {
  return {
    // Team management
    canCreateTeam: false,
    canEditTeam: false,
    canDeleteTeam: false,
    canViewTeam: true,
    canManageTeamInvites: false,

    // User management
    canViewUsers: false,
    canChangeUserRoles: false,
    canRemoveUsers: false,

    // Player management
    canCreatePlayer: false,
    canEditPlayer: false,
    canDeletePlayer: false,
    canViewPlayer: true,
    canManageRoster: false,

    // Event management
    canCreateEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewEvent: true,

    // Drill management
    canCreateDrill: false,
    canEditDrill: false,
    canDeleteDrill: false,
    canViewDrill: true,

    // Practice plan management
    canCreatePracticePlan: false,
    canEditPracticePlan: false,
    canDeletePracticePlan: false,
    canViewPracticePlan: true,

    // Attendance and RSVP
    canMarkAttendance: false,
    canViewAttendance: true,
    canRSVP: true,
    canViewRSVPs: true,

    // Stats and notes
    canRecordStats: false,
    canViewStats: false, // Players cannot view other players' stats; own stats shown on dashboard
    canAddCoachNotes: false,
    canViewCoachNotes: false,

    // Season management
    canCreateSeason: false,
    canEditSeason: false,
    canDeleteSeason: false,
    canViewSeason: true,

    canApproveMembers: false,
  };
}

function getParentPermissions(): Permissions {
  return {
    // Team management
    canCreateTeam: false,
    canEditTeam: false,
    canDeleteTeam: false,
    canViewTeam: true,
    canManageTeamInvites: false,

    // User management
    canViewUsers: false,
    canChangeUserRoles: false,
    canRemoveUsers: false,

    // Player management
    canCreatePlayer: false,
    canEditPlayer: false,
    canDeletePlayer: false,
    canViewPlayer: true,
    canManageRoster: false,

    // Event management
    canCreateEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewEvent: true,

    // Drill management
    canCreateDrill: false,
    canEditDrill: false,
    canDeleteDrill: false,
    canViewDrill: false,

    // Practice plan management
    canCreatePracticePlan: false,
    canEditPracticePlan: false,
    canDeletePracticePlan: false,
    canViewPracticePlan: false,

    // Attendance and RSVP
    canMarkAttendance: false,
    canViewAttendance: true, // Linked players only
    canRSVP: true, // For linked players
    canViewRSVPs: true, // Linked players only

    // Stats and notes
    canRecordStats: false,
    canViewStats: true, // Linked players only
    canAddCoachNotes: false,
    canViewCoachNotes: false,

    // Season management
    canCreateSeason: false,
    canEditSeason: false,
    canDeleteSeason: false,
    canViewSeason: true,

    canApproveMembers: false,
  };
}

function getGuestPermissions(): Permissions {
  return {
    // Team management
    canCreateTeam: false,
    canEditTeam: false,
    canDeleteTeam: false,
    canViewTeam: false,
    canManageTeamInvites: false,

    // User management
    canViewUsers: false,
    canChangeUserRoles: false,
    canRemoveUsers: false,

    // Player management
    canCreatePlayer: false,
    canEditPlayer: false,
    canDeletePlayer: false,
    canViewPlayer: false,
    canManageRoster: false,

    // Event management
    canCreateEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewEvent: false,

    // Drill management
    canCreateDrill: false,
    canEditDrill: false,
    canDeleteDrill: false,
    canViewDrill: false,

    // Practice plan management
    canCreatePracticePlan: false,
    canEditPracticePlan: false,
    canDeletePracticePlan: false,
    canViewPracticePlan: false,

    // Attendance and RSVP
    canMarkAttendance: false,
    canViewAttendance: false,
    canRSVP: false,
    canViewRSVPs: false,

    // Stats and notes
    canRecordStats: false,
    canViewStats: false,
    canAddCoachNotes: false,
    canViewCoachNotes: false,

    // Season management
    canCreateSeason: false,
    canEditSeason: false,
    canDeleteSeason: false,
    canViewSeason: false,

    canApproveMembers: false,
  };
}

/**
 * Hook to access permissions for the current user
 */
export function usePermissions(): Permissions & { role: UserRole | null; isCoach: boolean } {
  const { user } = useAuth();
  const permissions = getPermissionsForRole(user?.role || null);

  return {
    ...permissions,
    role: user?.role || null,
    isCoach: user?.role === 'head_coach' || user?.role === 'assistant_coach',
  };
}
