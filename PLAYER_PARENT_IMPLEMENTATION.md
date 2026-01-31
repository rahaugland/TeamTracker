# Player and Parent Views Implementation

## Overview
Implemented simplified player and parent dashboards for the TeamTracker volleyball app with role-based routing and navigation.

## Files Created

### Services
- **src/services/parent-links.service.ts**
  - Manages parent-child player relationships
  - Functions: `getLinkedPlayers()`, `createParentLink()`, `deleteParentLink()`, `parentLinkExists()`

### Pages
- **src/pages/PlayerDashboardPage.tsx**
  - Simplified dashboard for players
  - Shows upcoming events with RSVP functionality
  - Displays personal attendance history and rate
  - Quick stats (attendance rate, upcoming events, team count)

- **src/pages/ParentDashboardPage.tsx**
  - Dashboard for parents to manage their children's activities
  - Link multiple players
  - View and manage RSVPs on behalf of children
  - See attendance history for linked players

### Components

#### Player Components (src/components/player/)
- **PlayerScheduleView.tsx**
  - Displays upcoming events with RSVP status
  - Shows event details (date, time, location, opponent)
  - Interactive RSVP button for each event
  - Color-coded event types and RSVP statuses

- **PlayerAttendanceHistory.tsx**
  - Visual attendance summary with percentage
  - Breakdown by status (present, late, absent, excused)
  - Recent attendance records list
  - Color-coded status indicators

#### Parent Components (src/components/parent/)
- **LinkedPlayerCard.tsx**
  - Displays linked player information
  - Shows teams and jersey numbers
  - Actions to view schedule and profile
  - Player photo support

### Routing & Navigation

#### Modified Files
- **src/App.tsx**
  - Added `PlayerDashboardPage` and `ParentDashboardPage` imports
  - Created `DashboardRedirect` component for role-based routing
  - Routes:
    - `/dashboard` → redirects based on role
    - `/player-dashboard` → Player dashboard
    - `/parent-dashboard` → Parent dashboard
    - `/coach-dashboard` → Coach dashboard (existing)

- **src/components/layout/AppShell.tsx**
  - Implemented `getNavigation()` function for role-based menus
  - Player navigation: Dashboard, Schedule, Teams, Profile
  - Parent navigation: Dashboard, Schedule, Players, Profile
  - Coach navigation: Full access to all features

### Translations

#### English (src/i18n/locales/en/translation.json)
Added new keys under `dashboard.player` and `dashboard.parent`:
- Player-specific: myDashboard, myTeams, mySchedule, myStats, noPlayerProfile, contactCoach
- Parent-specific: myDashboard, myPlayers, linkPlayer, linkAnotherPlayer, noLinkedPlayers, linkPlayerDescription, searchPlayerPlaceholder, viewingScheduleFor, linkedSuccessfully, alreadyLinked

#### Norwegian (src/i18n/locales/no/translation.json)
Corresponding Norwegian translations for all new keys.

## Features Implemented

### 1. Player Dashboard
- **Quick Stats**: Attendance rate, upcoming events count, team count
- **Next Event Card**: Highlighted next practice/game with quick RSVP
- **Schedule View**: List of upcoming events with RSVP functionality
- **Attendance History**: Visual representation of attendance with breakdown
- **RSVP Dialog**: Modal to update RSVP status for events

### 2. Parent Dashboard
- **Link Players**: Search and link child player profiles
- **Multiple Children Support**: View and manage multiple linked players
- **Player Cards**: Visual cards for each linked player with team info
- **Schedule Management**: View schedules for selected player
- **RSVP on Behalf**: Submit RSVPs for linked players
- **Attendance Tracking**: Monitor child's attendance history

### 3. Role-Based Routing
- Automatic redirection based on user role on login
- Players → `/player-dashboard`
- Parents → `/parent-dashboard`
- Coaches → `/coach-dashboard`

### 4. Simplified Navigation
- **Players**: Dashboard, Schedule, Teams, Profile (no drill/practice plan access)
- **Parents**: Dashboard, Schedule, Players, Profile (limited player view)
- **Coaches**: Full access to all features (unchanged)

### 5. Permission-Based Features
- Uses existing `usePermissions` hook for access control
- Players can:
  - View their schedule and team roster
  - RSVP to events
  - View their own attendance and stats
- Parents can:
  - View linked player schedules
  - RSVP on behalf of their children
  - View children's attendance records

## Technical Implementation

### Data Flow
1. **Player Dashboard**:
   - Fetches player record using `user_id`
   - Loads team memberships and upcoming events
   - Retrieves attendance records and RSVPs
   - Displays aggregated data with RSVP functionality

2. **Parent Dashboard**:
   - Fetches linked players using `parent_id`
   - Allows linking new players via search
   - Switches between linked players to view their data
   - Manages RSVPs for selected player

### Security Considerations
- All data access respects existing RLS policies in Supabase
- Parent-child links stored in `parent_child_links` table
- RSVP submissions track `responded_by` to differentiate parent vs player responses
- Read-only access for players to coach notes and team management

### UI/UX Features
- Mobile-first responsive design
- Color-coded event types and attendance statuses
- Visual attendance percentage indicators
- Quick action buttons for common tasks
- Loading states for async operations
- Empty states with helpful guidance

## Database Schema Notes

The implementation assumes the following table exists (as per the types):
```sql
parent_child_links (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES profiles(id),
  child_id uuid REFERENCES players(id),
  created_at timestamptz
)
```

## Dependencies

The implementation uses existing dependencies:
- react-router-dom (routing)
- react-i18next (translations)
- date-fns (date formatting)
- lucide-react (icons)
- shadcn/ui components (UI)

**Note**: Ensure `date-fns` is installed:
```bash
npm install date-fns
```

## Usage Instructions

### For Players
1. Sign in with Google
2. Select "Player" role during onboarding
3. Join a team using the invite code from coach
4. Access player dashboard to:
   - View upcoming practices and games
   - RSVP to events
   - Track personal attendance

### For Parents
1. Sign in with Google
2. Select "Parent" role during onboarding
3. Link child's player profile:
   - Search by player name
   - Select and link player
4. Access parent dashboard to:
   - View child's schedule
   - RSVP on their behalf
   - Monitor attendance

### For Coaches
- No changes to existing workflow
- Can view all player and parent data through existing interfaces

## Future Enhancements

Potential improvements:
1. **Email Notifications**: Send RSVP confirmations and reminders
2. **Calendar Integration**: Export schedule to Google Calendar/iCal
3. **Stats Dashboard**: More detailed player statistics for players and parents
4. **Team Chat**: Communication feature for team members
5. **Photo Gallery**: Share event photos with team
6. **Injury Tracking**: Log and track player injuries for parents
7. **Coach Approval**: Require coach approval for parent-player links
8. **Bulk RSVP**: Allow parents to RSVP for all upcoming events at once

## Testing Checklist

- [ ] Player can view their dashboard after login
- [ ] Player can RSVP to events
- [ ] Player sees correct attendance history
- [ ] Parent can link player profiles
- [ ] Parent can view linked player schedules
- [ ] Parent can RSVP on behalf of player
- [ ] Role-based routing redirects correctly
- [ ] Navigation menu shows role-appropriate items
- [ ] Mobile responsive design works correctly
- [ ] Translations display correctly in both languages
- [ ] Empty states show helpful messages
- [ ] Loading states display during data fetch
- [ ] Error handling works for failed operations
