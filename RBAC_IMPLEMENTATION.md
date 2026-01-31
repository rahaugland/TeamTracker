# User Management and Role-Based Access Control (RBAC) Implementation

This document describes the user management and role-based access control system implemented for TeamTracker.

## Overview

The RBAC system provides granular permission control based on four user roles:
- **Head Coach**: Full administrative access
- **Assistant Coach**: Can manage players, events, drills, and attendance (cannot manage teams or other coaches)
- **Player**: Can view schedules, RSVP to events, and view own stats
- **Parent**: Can view schedules and RSVP for linked players

## Files Created

### Services
- **`src/services/users.service.ts`**: User CRUD operations and team management
  - `getAllUsers()` - Fetch all users with team information
  - `getUserById()` - Get single user with teams
  - `updateUserRole()` - Change user's role (head coach only)
  - `updateUserProfile()` - Update user profile information
  - `removeUserFromTeam()` - Remove player from team
  - `removeCoachFromTeam()` - Remove coach assignment
  - `searchUsers()` - Search users by name or email

### Hooks
- **`src/hooks/usePermissions.ts`**: Permission management hook
  - Defines complete permission matrix for all roles
  - `usePermissions()` hook returns permissions for current user
  - `getPermissionsForRole()` helper function

### Components
- **`src/components/auth/PermissionGate.tsx`**: Conditional rendering component
  - Usage: `<PermissionGate permission="canCreateTeam">...</PermissionGate>`
  - Shows content only if user has the specified permission
  - Optional fallback UI for denied access

- **`src/components/ui/badge.tsx`**: Badge component for role/status display
- **`src/components/ui/table.tsx`**: Table components for data display
- **`src/components/ui/alert.tsx`**: Alert component for notifications

### Pages
- **`src/pages/UserManagementPage.tsx`**: User management interface (head coach only)
  - List all users with search and role filtering
  - Change user roles
  - Remove users from teams
  - View user team assignments

- **`src/pages/ProfilePage.tsx`**: User profile management
  - Edit personal information (name, phone, avatar)
  - View current role and permissions
  - View assigned teams
  - Available to all authenticated users

## Permission Matrix

### Team Management
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Create Team | ✓ | ✗ | ✗ | ✗ |
| Edit Team | ✓ | ✓ | ✗ | ✗ |
| Delete Team | ✓ | ✗ | ✗ | ✗ |
| View Team | ✓ | ✓ | ✓ | ✓ |
| Manage Invites | ✓ | ✓ | ✗ | ✗ |

### User Management
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| View Users | ✓ | ✓ | ✗ | ✗ |
| Change Roles | ✓ | ✗ | ✗ | ✗ |
| Remove Users | ✓ | ✗ | ✗ | ✗ |

### Player Management
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Create Player | ✓ | ✓ | ✗ | ✗ |
| Edit Player | ✓ | ✓ | ✗ | ✗ |
| Delete Player | ✓ | ✗ | ✗ | ✗ |
| View Player | ✓ | ✓ | ✓ | ✓ |
| Manage Roster | ✓ | ✓ | ✗ | ✗ |

### Event Management
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Create Event | ✓ | ✓ | ✗ | ✗ |
| Edit Event | ✓ | ✓ | ✗ | ✗ |
| Delete Event | ✓ | ✓ | ✗ | ✗ |
| View Event | ✓ | ✓ | ✓ | ✓ |

### Drill & Practice Management
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Create/Edit Drills | ✓ | ✓ | ✗ | ✗ |
| Delete Drills | ✓ | ✓ | ✗ | ✗ |
| View Drills | ✓ | ✓ | ✓ | ✗ |
| Manage Practice Plans | ✓ | ✓ | ✗ | ✗ |

### Attendance & RSVP
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Mark Attendance | ✓ | ✓ | ✗ | ✗ |
| View Attendance | ✓ | ✓ | ✓ | ✓* |
| RSVP | ✓ | ✓ | ✓ | ✓* |
| View RSVPs | ✓ | ✓ | ✓ | ✓* |

*Parents can only view/manage for linked players

### Stats & Notes
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Record Stats | ✓ | ✓ | ✗ | ✗ |
| View Stats | ✓ | ✓ | ✓* | ✓* |
| Add Coach Notes | ✓ | ✓ | ✗ | ✗ |
| View Coach Notes | ✓ | ✓ | ✗ | ✗ |

*Players/Parents can only view own/linked player stats

### Season Management
| Permission | Head Coach | Assistant Coach | Player | Parent |
|-----------|------------|-----------------|--------|--------|
| Create Season | ✓ | ✗ | ✗ | ✗ |
| Edit Season | ✓ | ✗ | ✗ | ✗ |
| Delete Season | ✓ | ✗ | ✗ | ✗ |
| View Season | ✓ | ✓ | ✓ | ✓ |

## Usage Examples

### Using the PermissionGate Component

```tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

// Only show to users who can create teams
<PermissionGate permission="canCreateTeam">
  <Button>Create Team</Button>
</PermissionGate>

// With fallback UI
<PermissionGate
  permission="canViewCoachNotes"
  fallback={<p>You don't have access to coach notes</p>}
>
  <CoachNotesPanel />
</PermissionGate>
```

### Using the usePermissions Hook

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const permissions = usePermissions();

  // Check specific permission
  if (permissions.canDeleteTeam) {
    return <DeleteButton />;
  }

  // Check role
  if (permissions.isCoach) {
    return <CoachDashboard />;
  }

  // Access role directly
  const roleLabel = permissions.role; // 'head_coach' | 'assistant_coach' | 'player' | 'parent'
}
```

### Calling User Service Functions

```tsx
import {
  getAllUsers,
  updateUserRole,
  removeUserFromTeam
} from '@/services/users.service';

// Get all users
const users = await getAllUsers();

// Get users filtered by role
const players = await getAllUsers('player');

// Change user role (head coach only)
await updateUserRole(userId, 'assistant_coach');

// Remove user from team
await removeUserFromTeam(membershipId);
```

## Navigation

- **User Management**: `/users` (Head Coach only) - Accessible via sidebar navigation
- **Profile Page**: `/profile` (All users) - Accessible via user dropdown menu in AppShell

## Translations

All UI text is fully translated in both English and Norwegian:

### English Keys
- `navigation.users` - "Users"
- `navigation.profile` - "Profile"
- `users.*` - All user management strings
- `profile.*` - All profile page strings

### Norwegian Keys
- `navigation.users` - "Brukere"
- `navigation.profile` - "Profil"
- `users.*` - Norwegian translations
- `profile.*` - Norwegian translations

## Integration with Existing Features

The RBAC system integrates seamlessly with existing features:

1. **Navigation (AppShell)**: Head coaches see "Users" link in sidebar
2. **User Menu**: All users can access "Profile" from dropdown menu
3. **Auth Store**: User role is already stored in the auth slice
4. **Database**: Uses existing `profiles` table with `role` field

## Security Considerations

1. **Client-side permissions** are for UI/UX only
2. **Server-side enforcement** should be implemented in Supabase Row Level Security (RLS) policies
3. The permission system is extensible - new permissions can be added to the matrix
4. Role changes require head coach privileges

## Future Enhancements

Potential improvements for the RBAC system:

1. **Parent-Child Linking**: Implement UI for parents to link to their children
2. **Audit Log**: Track role changes and user management actions
3. **Custom Permissions**: Allow creating custom roles with specific permission sets
4. **Team-Level Permissions**: Different permissions per team (e.g., assistant coach on one team, head coach on another)
5. **Invite System**: Allow coaches to invite users via email with pre-assigned roles
6. **Bulk Operations**: Change roles or manage multiple users at once

## Testing Recommendations

1. Test each role's access to protected routes
2. Verify permission gates hide/show UI appropriately
3. Test role changes update permissions immediately
4. Test removing users from teams
5. Test profile updates
6. Test search and filtering in user management
7. Verify translations display correctly in both languages

## Database Schema Requirements

The system uses the existing `profiles` table:

```sql
profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL, -- 'head_coach' | 'assistant_coach' | 'player' | 'parent'
  avatar_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

Team relationships are managed through:
- `coach_assignments` table (for coaches)
- `team_memberships` table (for players)

## Support

For questions or issues with the RBAC system, refer to:
- Permission matrix in `src/hooks/usePermissions.ts`
- Service functions in `src/services/users.service.ts`
- UI components in `src/pages/UserManagementPage.tsx` and `src/pages/ProfilePage.tsx`
