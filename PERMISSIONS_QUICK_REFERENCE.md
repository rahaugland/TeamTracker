# Permissions Quick Reference

## Available Permissions

This is a quick reference for all available permissions in the `usePermissions` hook.

### Team Management
- `canCreateTeam` - Create new teams
- `canEditTeam` - Edit team details
- `canDeleteTeam` - Delete teams
- `canViewTeam` - View team information
- `canManageTeamInvites` - Manage team invite codes

### User Management
- `canViewUsers` - View user list
- `canChangeUserRoles` - Change user roles
- `canRemoveUsers` - Remove users from teams

### Player Management
- `canCreatePlayer` - Create new players
- `canEditPlayer` - Edit player information
- `canDeletePlayer` - Delete players
- `canViewPlayer` - View player information
- `canManageRoster` - Manage team rosters

### Event Management
- `canCreateEvent` - Create events (practices, games, etc.)
- `canEditEvent` - Edit event details
- `canDeleteEvent` - Delete events
- `canViewEvent` - View event information

### Drill Management
- `canCreateDrill` - Create new drills
- `canEditDrill` - Edit drill information
- `canDeleteDrill` - Delete drills
- `canViewDrill` - View drill information

### Practice Plan Management
- `canCreatePracticePlan` - Create practice plans
- `canEditPracticePlan` - Edit practice plans
- `canDeletePracticePlan` - Delete practice plans
- `canViewPracticePlan` - View practice plans

### Attendance & RSVP
- `canMarkAttendance` - Mark player attendance at events
- `canViewAttendance` - View attendance records
- `canRSVP` - RSVP to events
- `canViewRSVPs` - View RSVP status

### Stats & Notes
- `canRecordStats` - Record player statistics
- `canViewStats` - View statistics
- `canAddCoachNotes` - Add coach notes
- `canViewCoachNotes` - View coach notes

### Season Management
- `canCreateSeason` - Create new seasons
- `canEditSeason` - Edit season details
- `canDeleteSeason` - Delete seasons
- `canViewSeason` - View season information

### Additional Properties
- `role` - The user's current role (UserRole | null)
- `isCoach` - Boolean: true if head_coach or assistant_coach

## Quick Role Comparison

| Feature | Head Coach | Assistant Coach | Player | Parent |
|---------|-----------|----------------|--------|---------|
| Full Admin | ✓ | ✗ | ✗ | ✗ |
| Manage Teams | ✓ | Edit only | ✗ | ✗ |
| Manage Users | ✓ | View only | ✗ | ✗ |
| Manage Players | ✓ | ✓ (no delete) | ✗ | ✗ |
| Manage Events | ✓ | ✓ | ✗ | ✗ |
| Manage Drills | ✓ | ✓ | View only | ✗ |
| Mark Attendance | ✓ | ✓ | ✗ | ✗ |
| RSVP | ✓ | ✓ | ✓ | ✓* |
| View Stats | ✓ | ✓ | Own only | Linked only |

*Parents can only RSVP for linked players

## Code Examples

### Basic Permission Check
```tsx
const permissions = usePermissions();

if (permissions.canCreateTeam) {
  // Show create team button
}
```

### Role Check
```tsx
const permissions = usePermissions();

if (permissions.isCoach) {
  // Show coach-specific features
}

switch (permissions.role) {
  case 'head_coach':
    // Head coach specific
    break;
  case 'assistant_coach':
    // Assistant coach specific
    break;
  // ...
}
```

### Multiple Permission Check
```tsx
const permissions = usePermissions();

const canManageEvents =
  permissions.canCreateEvent &&
  permissions.canEditEvent;

if (canManageEvents) {
  // Show event management UI
}
```

### Using PermissionGate
```tsx
// Simple usage
<PermissionGate permission="canDeleteTeam">
  <DeleteTeamButton />
</PermissionGate>

// With fallback
<PermissionGate
  permission="canViewCoachNotes"
  fallback={<p>Access denied</p>}
>
  <CoachNotes />
</PermissionGate>

// Nested gates (AND logic)
<PermissionGate permission="canEditTeam">
  <PermissionGate permission="canManageRoster">
    <AdvancedTeamEditor />
  </PermissionGate>
</PermissionGate>
```

### Component-wide Permission
```tsx
function TeamManagement() {
  const permissions = usePermissions();

  if (!permissions.canViewTeam) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Team Management</h1>
      {permissions.canCreateTeam && <CreateButton />}
      {permissions.canEditTeam && <EditButton />}
      {permissions.canDeleteTeam && <DeleteButton />}
    </div>
  );
}
```

### Dynamic Button State
```tsx
function ActionButton() {
  const permissions = usePermissions();

  return (
    <Button
      disabled={!permissions.canEditPlayer}
      onClick={handleEdit}
    >
      Edit Player
    </Button>
  );
}
```

## Permission Patterns

### Read vs Write Permissions
Most features have separate permissions for viewing and modifying:
- `canView*` - Read access only
- `canCreate*` - Create new items
- `canEdit*` - Modify existing items
- `canDelete*` - Remove items

### Hierarchical Permissions
Some permissions imply others:
- If you can `canDeleteTeam`, you usually have `canEditTeam` and `canViewTeam`
- If you can `canManageRoster`, you usually have `canViewPlayer`

### Context-Sensitive Permissions
Some permissions apply differently based on context:
- `canViewStats` - Coaches see all, players see only their own
- `canRSVP` - Parents can only RSVP for linked children
- `canViewAttendance` - Parents see only linked children

## Best Practices

### DO ✅
- Always check permissions before showing UI elements
- Use `<PermissionGate>` for clean conditional rendering
- Check permissions at the component level, not just routes
- Provide helpful fallback messages when access is denied
- Use `isCoach` for broad coach vs non-coach distinctions

### DON'T ❌
- Don't rely solely on client-side permissions for security
- Don't check permissions in service/API files (use RLS instead)
- Don't show error messages for missing permissions (hide UI instead)
- Don't check multiple individual permissions when `isCoach` would suffice
- Don't forget that permissions are for UI/UX, not data protection

## Extending Permissions

To add a new permission:

1. Add it to the `Permissions` interface in `usePermissions.ts`
2. Update each role's permission function (e.g., `getHeadCoachPermissions`)
3. Use it in your components via `usePermissions()` or `<PermissionGate>`

Example:
```typescript
// 1. Add to interface
export interface Permissions {
  // ... existing permissions
  canExportData: boolean;  // New permission
}

// 2. Update role functions
function getHeadCoachPermissions(): Permissions {
  return {
    // ... existing permissions
    canExportData: true,  // Head coaches can export
  };
}

function getAssistantCoachPermissions(): Permissions {
  return {
    // ... existing permissions
    canExportData: false,  // Assistant coaches cannot
  };
}

// 3. Use in components
<PermissionGate permission="canExportData">
  <ExportButton />
</PermissionGate>
```

## Related Files

- **Permission definitions**: `src/hooks/usePermissions.ts`
- **Permission gate component**: `src/components/auth/PermissionGate.tsx`
- **Full documentation**: `RBAC_IMPLEMENTATION.md`

---

**Quick Tip**: When in doubt, check `src/hooks/usePermissions.ts` for the complete permission matrix with comments explaining each role's capabilities.
