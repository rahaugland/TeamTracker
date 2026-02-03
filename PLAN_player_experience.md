# Player Experience Enhancement - Implementation Plan

## Overview

Enhance the player experience to match the wireframe at `player-experience-wireframe.html`. The wireframe shows 5 main pages: Dashboard, Schedule, My Stats, Progress, and Profile.

**Key Finding:** Many gamification features already exist (goals, streaks, awards, ratings, feedback, self-assessments). The main work is redesigning the UI to match the wireframe and adding missing features.

---

## Gap Analysis

| Feature | Current State | Wireframe Requirements |
|---------|---------------|----------------------|
| **Dashboard Layout** | Tab-based (Home/Stats/Progress) | Hero grid with FIFA card + Next Event side-by-side |
| **Quick Stats Grid** | Exists but different layout | 4-column grid with streak, attendance, goals, games |
| **Upcoming Events** | Shows in schedule | Preview list on dashboard with RSVP status |
| **Team Announcements** | Not implemented | Pinned + regular announcements list |
| **Schedule Page** | Uses shared SchedulePage | Dedicated player schedule with quick RSVP buttons |
| **RSVP Summary** | Not shown | Stats grid: Events/Confirmed/Pending/Can't Attend |
| **Quick RSVP** | Navigate to event | Inline ✓/✕ buttons on schedule items |
| **Skill Bars** | Not implemented | Horizontal bars with % fill and trend arrows |
| **Rating Chart** | Not implemented | Line chart showing rating progression |
| **Game Log Table** | Exists in PlayerStatsPage | Matches wireframe (Date, Opponent, Result, K, K%, A, B, D) |
| **Streak Cards** | AttendanceStreakCard exists | 4-card grid matching wireframe |
| **Self-Reflection Form** | Exists as modal | Inline form on Progress page |
| **Profile Page** | Basic profile | Full profile with career stats, achievements, settings |
| **Settings Toggles** | Not implemented | Email/Push notifications, Stats visibility |
| **Achievements Display** | Awards exist | Achievement cards with icons |

---

## Phase 1: Database Schema

### New Table: `team_announcements`

```sql
CREATE TABLE team_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### New Table: `player_settings`

```sql
CREATE TABLE player_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  show_stats_publicly BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id)
);
```

---

## Phase 2: New Services

### `src/services/announcements.service.ts`

Functions:
- `getTeamAnnouncements(teamId: string): Promise<Announcement[]>`
- `createAnnouncement(data: CreateAnnouncementInput): Promise<Announcement>`
- `updateAnnouncement(id: string, data: UpdateAnnouncementInput): Promise<void>`
- `deleteAnnouncement(id: string): Promise<void>`
- `togglePinned(id: string): Promise<void>`

### `src/services/player-settings.service.ts`

Functions:
- `getPlayerSettings(playerId: string): Promise<PlayerSettings>`
- `updatePlayerSettings(playerId: string, settings: Partial<PlayerSettings>): Promise<void>`

---

## Phase 3: New Components

### `src/components/player-dashboard/`

| Component | Description |
|-----------|-------------|
| `PlayerDashboardHero.tsx` | Hero grid layout with FIFA card + Next Event |
| `NextEventCard.tsx` | Next event hero with RSVP buttons |
| `QuickStatsGrid.tsx` | 4-column stats grid (streak, attendance, goals, games) |
| `UpcomingEventsPreview.tsx` | This week's events with RSVP status badges |
| `AnnouncementsList.tsx` | Team announcements with pinned support |
| `AnnouncementCard.tsx` | Individual announcement card |

### `src/components/player-schedule/`

| Component | Description |
|-----------|-------------|
| `PlayerSchedulePage.tsx` | Dedicated player schedule page |
| `ScheduleFilters.tsx` | Month filter buttons |
| `RSVPSummaryGrid.tsx` | RSVP stats summary (Events/Confirmed/Pending/Can't) |
| `ScheduleList.tsx` | List of schedule items |
| `ScheduleItem.tsx` | Individual event with quick RSVP buttons |
| `QuickRSVPButtons.tsx` | Inline ✓/✕ RSVP buttons |

### `src/components/player-stats/` (enhance existing)

| Component | Description |
|-----------|-------------|
| `SkillRatingsCard.tsx` | Skill bars with trends (SRV, RCV, SET, BLK, ATK, DIG, MNT, PHY) |
| `SkillBar.tsx` | Individual skill bar with gradient fill |
| `RatingProgressionChart.tsx` | Line chart showing rating over time |
| `PeriodFilter.tsx` | Filter buttons (Last 30 Days, This Season, All Time) |
| `GameLogTable.tsx` | Recent games table (enhance existing) |

### `src/components/player-progress/`

| Component | Description |
|-----------|-------------|
| `StreakCardsGrid.tsx` | 4-card streak stats grid |
| `StreakCard.tsx` | Individual streak stat card |
| `ActiveGoalsCard.tsx` | Goals list with progress (enhance existing) |
| `CoachFeedbackCard.tsx` | Recent coach feedback timeline |
| `SelfReflectionInlineForm.tsx` | Inline self-reflection form |
| `ProgressJourneyCard.tsx` | Progress timeline (enhance existing) |

### `src/components/player-profile/`

| Component | Description |
|-----------|-------------|
| `ProfileHeader.tsx` | Avatar, name, position, jersey, teams |
| `CareerStatsGrid.tsx` | Career statistics cards |
| `AchievementsGrid.tsx` | Achievement cards display |
| `SettingsCard.tsx` | Settings with toggle switches |
| `SettingsToggle.tsx` | Individual toggle switch component |
| `TeamMembershipCard.tsx` | Join team section |

---

## Phase 4: Page Redesign

### `src/pages/PlayerDashboardPage.tsx`

Current structure: Tab-based (Home, Stats, Progress)

New structure:
- Remove tabs, create separate route pages
- Dashboard becomes the "Home" view
- Layout: Hero Grid → Quick Stats → Upcoming Events → Announcements

### `src/pages/PlayerSchedulePage.tsx` (new)

New dedicated schedule page for players:
- Month filter
- RSVP summary grid
- Schedule list with quick RSVP

### `src/pages/PlayerStatsPage.tsx` (enhance)

Add:
- Period filter
- Skill ratings card with bars
- Rating progression chart
- Keep existing game log table

### `src/pages/PlayerProgressPage.tsx` (new)

Extract from dashboard tabs:
- Streak cards grid
- Two-column: Goals + Coach Feedback
- Self-reflection form
- Progress journey timeline

### `src/pages/PlayerProfilePage.tsx` (new)

New profile page:
- Profile header
- Career stats grid
- Achievements grid
- Settings card
- Team membership

---

## Phase 5: Navigation Updates

### Player Navigation Structure

```
/player-dashboard     → Dashboard (Home)
/player-schedule      → Schedule with RSVP
/player-stats         → My Stats
/player-progress      → Progress & Goals
/player-profile       → Profile & Settings
```

### Mobile Bottom Navigation

Create `PlayerMobileNav.tsx`:
- Home icon → Dashboard
- Calendar icon → Schedule
- Chart icon → Stats
- Target icon → Progress
- User icon → Profile

---

## Phase 6: Skill Ratings Calculation

### Skill Categories (from wireframe)

| Skill | Abbreviation | Calculation |
|-------|--------------|-------------|
| Serve | SRV | Based on aces, service errors, serve attempts |
| Receive | RCV | Based on pass rating, pass attempts |
| Set | SET | Based on set attempts, setting errors |
| Block | BLK | Based on blocks, block touches |
| Attack | ATK | Based on kill%, kills, attack errors |
| Dig | DIG | Based on digs, ball handling errors |
| Mental | MNT | Based on consistency, attendance, self-assessments |
| Physique | PHY | Based on sets played, rotations played |

### Add to `player-stats.service.ts`

```typescript
interface SkillRatings {
  serve: number;      // 0-99
  receive: number;    // 0-99
  set: number;        // 0-99
  block: number;      // 0-99
  attack: number;     // 0-99
  dig: number;        // 0-99
  mental: number;     // 0-99
  physique: number;   // 0-99
}

function calculateSkillRatings(stats: AggregatedStats): SkillRatings
function getSkillTrend(playerId: string, skill: keyof SkillRatings): number // +/- change
```

---

## Phase 7: UI Polish

### Design System Alignment

- Use navy-80/navy-90 backgrounds
- Club colors for accents (club-primary, club-secondary)
- vq-teal for progress/success indicators
- Barlow Condensed for headings
- JetBrains Mono for stats/numbers

### Responsive Design

- Hero grid: 2 columns on desktop, stack on mobile
- Stats grid: 4 columns → 2 columns on mobile
- Schedule items: Horizontal → Stack on mobile
- Mobile bottom navigation bar

### Animations

- Skill bar fill animations on load
- Progress bar animations
- Streak card number count-up
- RSVP button state transitions

---

## Files Summary

### New Files (18)

| File | Description |
|------|-------------|
| `supabase/migrations/20260203_announcements.sql` | Announcements table |
| `supabase/migrations/20260203_player_settings.sql` | Player settings table |
| `src/services/announcements.service.ts` | Announcements CRUD |
| `src/services/player-settings.service.ts` | Settings CRUD |
| `src/components/player-dashboard/PlayerDashboardHero.tsx` | Hero grid |
| `src/components/player-dashboard/NextEventCard.tsx` | Next event with RSVP |
| `src/components/player-dashboard/QuickStatsGrid.tsx` | Stats grid |
| `src/components/player-dashboard/UpcomingEventsPreview.tsx` | Events preview |
| `src/components/player-dashboard/AnnouncementsList.tsx` | Announcements |
| `src/components/player-schedule/PlayerScheduleView.tsx` | Schedule components |
| `src/components/player-schedule/QuickRSVPButtons.tsx` | RSVP buttons |
| `src/components/player-stats/SkillRatingsCard.tsx` | Skill bars |
| `src/components/player-stats/RatingProgressionChart.tsx` | Rating chart |
| `src/components/player-progress/StreakCardsGrid.tsx` | Streak cards |
| `src/components/player-progress/SelfReflectionInlineForm.tsx` | Reflection form |
| `src/components/player-profile/ProfileHeader.tsx` | Profile header |
| `src/components/player-profile/SettingsCard.tsx` | Settings toggles |
| `src/pages/PlayerSchedulePage.tsx` | New schedule page |
| `src/pages/PlayerProgressPage.tsx` | New progress page |
| `src/pages/PlayerProfilePage.tsx` | New profile page |

### Modified Files (5)

| File | Changes |
|------|---------|
| `src/pages/PlayerDashboardPage.tsx` | Redesign to hero grid layout |
| `src/pages/PlayerStatsPage.tsx` | Add skill bars, period filter, chart |
| `src/services/player-stats.service.ts` | Add skill ratings calculation |
| `src/App.tsx` | Add new player routes |
| `src/components/layout/AppShell.tsx` | Add player mobile nav |

---

## Verification Plan

1. **Database Tests**
   - Announcements table created
   - Player settings table created
   - RLS policies work correctly

2. **Service Tests**
   - Announcements CRUD works
   - Settings persist correctly
   - Skill ratings calculate properly

3. **UI Tests**
   - Dashboard matches wireframe layout
   - Schedule shows quick RSVP buttons
   - Skill bars animate correctly
   - Stats page shows period filter
   - Progress page shows goals + feedback
   - Profile shows settings toggles

4. **Responsive Tests**
   - Mobile layout matches wireframe
   - Bottom navigation works
   - Touch targets are adequate

5. **Visual Comparison**
   - Compare each page against wireframe
   - Verify colors, typography, spacing

---

## Implementation Order

1. **Database** - Create tables and migrations
2. **Services** - Implement announcements and settings services
3. **Dashboard Redesign** - Hero grid, next event, quick stats
4. **Schedule Page** - New page with quick RSVP
5. **Stats Enhancement** - Skill bars, period filter
6. **Progress Page** - Extract and enhance
7. **Profile Page** - New page with settings
8. **Navigation** - Routes and mobile nav
9. **Polish** - Animations, responsive fixes
