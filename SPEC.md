# TeamTracker - Product Specification

## Overview

TeamTracker is a volleyball team management application designed for coaches who need a centralized system to track athletes and plan seasons. The app prioritizes clean UX, offline capability, and practice planning features that existing solutions lack.

**Target User**: Volleyball coaches managing 1-3 teams, tech-comfortable, currently using Spond for scheduling but need volleyball-specific features.

---

## Core Principles

1. **Offline-first**: Must work fully without internet at gyms/fields, syncing when connected
2. **Clean UX**: Avoid feature overload; competitors fail by being either too basic/ugly or too complex/expensive
3. **Continuous player history**: Athletes are tracked across seasons and teams as a single identity
4. **Coach-centric**: Optimized for coach workflows; player/parent access is secondary
5. **Minimize running costs**: Architecture should stay within free tiers or very low-cost hosting

---

## User Roles & Permissions

| Role | Access |
|------|--------|
| **Head Coach** | Full access: all data, settings, user management, private notes |
| **Assistant Coach** | Full access to player data and planning; no user management |
| **Player** | View: own stats, team schedule. RSVP for events |
| **Parent** | View: their child's stats and schedule. RSVP on behalf of child |

### Authentication
- Social login (Google, Apple Sign-In)
- Coach invites users via email; they choose their social provider
- No password management required

---

## Data Model

### Core Entities

#### Player
```
Player {
  id: UUID
  name: string
  email?: string
  phone?: string
  birthDate?: date
  positions: Position[]  // e.g., ["setter", "libero"]
  photo?: URL
  createdAt: timestamp

  // Relationships
  teamMemberships: TeamMembership[]  // Links to teams across seasons
  stats: StatEntry[]
  attendanceRecords: AttendanceRecord[]
  coachNotes: CoachNote[]  // Private, coach-only
}
```

#### Team
```
Team {
  id: UUID
  name: string
  season: Season
  coaches: CoachAssignment[]
  players: TeamMembership[]
  events: Event[]
  createdAt: timestamp
}
```

#### Season
```
Season {
  id: UUID
  name: string  // e.g., "Fall 2024"
  startDate: date
  endDate: date
  isActive: boolean
  archived: boolean
}
```

#### TeamMembership
Links players to teams, enabling continuous history.
```
TeamMembership {
  id: UUID
  playerId: UUID
  teamId: UUID
  role: "player" | "captain"
  jerseyNumber?: number
  joinedAt: date
  leftAt?: date  // For mid-season departures
  departureReason?: "quit" | "injury" | "cut" | "other"
  isActive: boolean
}
```

#### Event
```
Event {
  id: UUID
  teamId: UUID
  type: "practice" | "game" | "tournament" | "meeting" | "other"
  title: string
  startTime: datetime
  endTime: datetime
  location?: string
  opponent?: string  // For games
  notes?: string

  // Practice planning link
  practicePlanId?: UUID

  // Attendance
  rsvps: RSVP[]
  attendance: AttendanceRecord[]
}
```

#### RSVP
```
RSVP {
  id: UUID
  eventId: UUID
  playerId: UUID
  status: "attending" | "not_attending" | "maybe" | "pending"
  respondedBy: UUID  // Player or parent
  respondedAt: timestamp
  note?: string
}
```

#### AttendanceRecord
```
AttendanceRecord {
  id: UUID
  eventId: UUID
  playerId: UUID
  status: "present" | "absent" | "late" | "excused"
  arrivedAt?: timestamp
  leftAt?: timestamp
  notes?: string
}
```

#### CoachNote (Private)
```
CoachNote {
  id: UUID
  playerId: UUID
  authorId: UUID  // Coach who wrote it
  content: string
  createdAt: timestamp
  updatedAt: timestamp
  tags?: string[]  // e.g., ["attitude", "skill-development", "playing-time"]
}
```

### Practice Planning

#### Drill
```
Drill {
  id: UUID
  name: string
  description: string
  skillTags: SkillTag[]  // e.g., ["passing", "serve-receive"]
  customTags: string[]  // User-defined
  progressionLevel: 1 | 2 | 3 | 4 | 5
  parentDrillId?: UUID  // Links progression chain
  minPlayers?: number
  maxPlayers?: number
  equipmentNeeded?: string[]
  durationMinutes?: number
  videoUrl?: string
  createdBy: UUID
  isSystemDrill: boolean  // Built-in vs user-created
}
```

#### SkillTag (System-defined + Custom)
Predefined volleyball skills:
- `passing`
- `setting`
- `hitting`
- `blocking`
- `serving`
- `serve-receive`
- `defense`
- `transition`
- `footwork`
- `conditioning`

Users can add custom tags.

#### PracticePlan
```
PracticePlan {
  id: UUID
  name: string
  teamId: UUID
  date?: date
  totalDurationMinutes: number  // Auto-calculated

  blocks: PracticeBlock[]
  notes?: string
  createdBy: UUID
  createdAt: timestamp
}
```

#### PracticeBlock
```
PracticeBlock {
  id: UUID
  practicePlanId: UUID
  order: number
  type: "warmup" | "drill" | "scrimmage" | "cooldown" | "break" | "custom"
  drillId?: UUID  // If type is "drill"
  customTitle?: string  // If type is "custom"
  durationMinutes: number
  notes?: string

  // Drill execution tracking
  executionRecords: DrillExecution[]
}
```

#### DrillExecution
Tracks when drills are performed for progression suggestions.
```
DrillExecution {
  id: UUID
  drillId: UUID
  eventId: UUID
  teamId: UUID
  executedAt: timestamp
  durationMinutes: number
  coachRating?: 1 | 2 | 3 | 4 | 5  // How well it went
  notes?: string
}
```

### Drill Progression Logic
- System tracks how many times each drill has been executed successfully (rating >= 3)
- After N successful executions (configurable, default 3), suggest advancing to next level
- Surface suggestions in practice planning UI: "Team has mastered Level 2 passing drills - consider Level 3"

### Game Statistics (Phase 2 - Not in MVP)

```
StatEntry {
  id: UUID
  playerId: UUID
  eventId: UUID  // The game

  // Basic box score
  kills: number
  attackErrors: number
  attackAttempts: number
  aces: number
  serviceErrors: number
  digs: number
  blockSolos: number
  blockAssists: number
  ballHandlingErrors: number

  // Serve receive
  passAttempts: number
  passSum: number  // Sum of 0-3 ratings
  // passAverage = passSum / passAttempts

  // By zone (optional detail)
  passRatingsByZone?: {
    zone1: { attempts: number, sum: number }
    zone5: { attempts: number, sum: number }
    zone6: { attempts: number, sum: number }
  }

  recordedAt: timestamp
  recordedBy: UUID
}
```

---

## Features by Phase

### MVP (Phase 1)

#### 1. Roster & Player Profiles
- Create/edit teams and seasons
- Add players with basic info (name, positions, photo)
- Continuous player profiles across teams/seasons
- View player history across all teams they've been on
- Soft delete (mark inactive) or full GDPR deletion
- Private coach notes per player

#### 2. Schedule & Attendance
- Create events (practice, game, tournament, meeting)
- RSVP system: players/parents indicate availability before events
- Attendance tracking: mark who showed up after events
- CSV import from Spond (attendance records)
- Calendar view (week/month)

#### 3. Practice Planning & Drill Library
- Drill library with:
  - Predefined volleyball skill tags
  - Custom tags
  - Progression levels 1-5
  - Drill descriptions and notes
- Practice plan builder:
  - Drag drills into time blocks
  - Auto-calculate total practice duration
  - Save as templates
- Track drill execution history
- Progression suggestions based on repetitions

#### 4. Analytics (Basic)
- Player attendance patterns (% attendance over time)
- Player stat trends (when stats are entered - placeholder for Phase 2)
- Season comparison view

#### 5. User Management
- Invite assistant coaches, players, parents
- Role-based access control
- Parent-child linking

### Phase 2

#### 6. Live Game Stats
- Tablet-optimized stat entry interface
- Real-time kill/error/dig tracking
- Pass rating entry (0-3 scale)
- Post-game summary entry mode
- Season stat aggregations

#### 7. Enhanced Analytics
- Stat trend visualizations
- Attendance correlation with performance
- Player comparison tools

### Phase 3 (Future)

#### 8. Lineup & Rotation Planning
- 6-rotation lineup planning
- Substitution pattern templates

#### 9. Spond Replacement
- Full scheduling with external calendar export
- Push notifications (if demand warrants)

---

## Technical Architecture

### Platform
- **Web application** (responsive, works on desktop and mobile browsers)
- **Progressive Web App (PWA)** for offline capability and home screen installation
- Primary use device: tablet (for game stats), phone/desktop for planning

### Offline-First Architecture

#### Sync Strategy
- All data stored locally (IndexedDB via a library like Dexie.js or RxDB)
- Background sync when online
- **Conflict resolution: Last write wins** (timestamp-based)
  - Tradeoff accepted: Simpler implementation, rare data loss acceptable
  - Most edits are by single coach; conflicts are rare
- Sync status indicator in UI

#### Data Flow
```
[Local IndexedDB] <--sync--> [Cloud Database]
         |
    [PWA/Browser]
```

### Suggested Tech Stack

#### Frontend
- **Framework**: React with TypeScript
- **UI**: Tailwind CSS + component library (Radix UI or similar)
- **Offline storage**: Dexie.js (IndexedDB wrapper)
- **State management**: Zustand or Jotai (lightweight)
- **PWA**: Workbox for service worker

#### Backend
- **Option A (Minimal cost)**: Supabase
  - PostgreSQL database
  - Built-in auth (supports Google/Apple)
  - Real-time subscriptions for sync
  - Generous free tier

- **Option B**: Firebase
  - Firestore with offline persistence
  - Firebase Auth
  - Slightly higher learning curve for relational data

- **Recommendation**: Supabase for better relational data modeling and lower cost at scale

#### Hosting
- **Frontend**: Vercel or Cloudflare Pages (free tier)
- **Backend**: Supabase free tier (500MB database, 1GB storage)

### Internationalization (i18n)
- Build with i18n from start using react-i18next or similar
- Default language: English
- Structure ready for Norwegian and other languages
- Store all user-facing strings in translation files

---

## UI/UX Guidelines

### Design Principles
1. **Mobile-first responsive**: Works on phone, optimized for tablet, good on desktop
2. **Minimal clicks**: Common actions (mark attendance, add drill) should be fast
3. **Clear hierarchy**: Coach sees everything; players/parents see simplified views
4. **Offline indicator**: Always show sync status; never lose data silently
5. **Clean, modern aesthetic**: Avoid cluttered "enterprise" look of competitors

### Key Screens

#### Coach Dashboard
- Active team overview
- Upcoming events (next 7 days)
- Quick actions: take attendance, create practice plan
- Alerts: upcoming games, low RSVPs

#### Team Roster
- List/grid view of players
- Quick filters: active, position, attendance %
- Tap player for full profile
- Bulk actions: message team (future)

#### Player Profile
- Basic info and photo
- Stats summary (when available)
- Attendance history with trend
- Season comparison charts
- Coach notes section (coach-only tab)

#### Calendar
- Month and week views
- Color coding by event type
- Tap event for details/attendance
- Drag to reschedule (desktop)

#### Practice Plan Builder
- Left panel: drill library with search/filter
- Main area: time-blocked schedule
- Drag drills into blocks
- Running duration total
- Save as template

#### Drill Library
- Search and filter by skill, level, tags
- Card view with preview
- Progression chains visible
- Track usage history

#### Attendance (for specific event)
- List of players with RSVP status
- One-tap attendance marking (present/absent/late)
- Bulk mark all present
- Notes per player

### Mobile Considerations
- Large touch targets for attendance/stat entry
- Swipe gestures for common actions
- Pull to refresh
- Floating action buttons for quick add

---

## Data Privacy & GDPR

### Requirements
1. **Consent**: Clear consent flow when coaches invite players/parents
2. **Data minimization**: Only collect necessary data (name required, other fields optional)
3. **Right to deletion**: Full player data deletion on request
4. **Data export**: Players/parents can request their data
5. **Data retention**: Archived season data kept unless deletion requested

### Implementation
- Deletion cascade: remove all player data, stats, attendance, notes
- Anonymization option: keep stats but remove identifying info
- Audit log of data access (future consideration)

---

## CSV Import (Spond)

### Supported Import
- Attendance records: map date/time + player name to events
- Import wizard:
  1. Upload CSV
  2. Map columns (date, player name, status)
  3. Match players to existing roster
  4. Preview and confirm
  5. Import

### CSV Format Expected
```csv
Date,Time,Event,Player Name,Status
2024-09-15,18:00,Practice,John Smith,Attended
2024-09-15,18:00,Practice,Jane Doe,Absent
```

---

## Analytics Requirements

### Player Attendance Patterns
- Attendance % per player (by season)
- Attendance trend chart (rolling average)
- Perfect attendance highlights
- Correlation: attendance vs. stats (Phase 2)

### Player Stat Trends (Phase 2)
- Stat graphs over time (kill %, pass average)
- Compare across seasons
- Highlight improvements/regressions

### Season Comparison
- Side-by-side seasons for same player
- Show growth over time

---

## Edge Cases & Error Handling

### Player Departure Mid-Season
- Mark as inactive with reason (quit, injury, cut, other)
- Stats and history preserved
- Option to reactivate if they return
- Full deletion available if requested (GDPR)

### Season Rollover
- Archive previous season
- Create new season with option to copy roster
- Players carry over as continuous profiles

### Offline Conflicts
- Last write wins by timestamp
- No manual merge UI (accepted tradeoff)
- Sync log visible for debugging if needed

### Data Validation
- Required fields: player name, event title, event time
- Prevent duplicate players by name (warning, not block)
- Event time validation (end after start)

---

## Success Metrics

1. **Adoption**: Coach uses app for every practice (attendance tracked)
2. **Time saved**: Practice planning faster than previous method
3. **Data completeness**: >80% attendance records filled
4. **Offline reliability**: Zero data loss incidents
5. **UX satisfaction**: Preferred over previous tools (Spond, spreadsheets)

---

## Out of Scope (Explicitly Not Building)

- Video analysis/upload
- Communication/messaging (use existing tools)
- Payment/fee collection
- Team statistics comparison across clubs
- Public-facing team pages
- Hardware integrations (stat tracking devices)

---

## Open Questions for Implementation

1. **Supabase vs Firebase**: Final decision based on offline sync library maturity
2. **PWA vs React Native**: PWA chosen for cost, revisit if native features needed
3. **Drill library seed data**: Need initial set of volleyball drills with progressions
4. **Notification strategy**: In-app only for MVP; revisit push notifications if users request

---

## Appendix: Volleyball Skill Tags (Default)

| Tag | Description |
|-----|-------------|
| `passing` | Forearm passing, platform control |
| `setting` | Hand setting, decision making |
| `hitting` | Attacking, approach, arm swing |
| `blocking` | Net defense, timing, footwork |
| `serving` | Float, topspin, jump serve |
| `serve-receive` | Passing served balls, formation |
| `defense` | Digging, floor defense |
| `transition` | Off-the-net plays, quick attacks |
| `footwork` | Movement patterns, positioning |
| `conditioning` | Fitness, agility, endurance |

---

*Specification Version: 1.0*
*Last Updated: January 2026*
