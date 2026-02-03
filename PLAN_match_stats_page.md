# Match Stats Recording Page - Implementation Plan

## Overview

Enhance the existing `RecordStatsPage` to match the wireframe design at `match-stats-wireframe.html`. The current implementation has basic spreadsheet functionality but lacks the polished UI, player card view, match header with score inputs, and quick stats summary.

---

## Gap Analysis

| Feature | Current State | Wireframe Requirements |
|---------|---------------|----------------------|
| **Match Header** | Basic title + back button | Full header with score inputs, set scores, team badges |
| **Quick Stats Bar** | Missing | Live team totals summary (kills, K%, aces, blocks, digs, pass rating, errors) |
| **View Toggle** | Spreadsheet only | Player Cards + Spreadsheet toggle |
| **Player Selector** | Missing | Horizontal scrollable chip selector |
| **Player Card View** | Missing | Individual player stats card with +/- counters |
| **Stat Categories** | Flat table columns | Grouped categories with icons and calculated values |
| **Action Bar** | Save All button in header | Sticky bottom bar with save status, Cancel, Save All, Finalize |
| **Breadcrumb** | Back button only | Full breadcrumb path |
| **Auto-save indicator** | Missing | "All changes saved" status indicator |

---

## Phase 1: Match Header Enhancement

**Modify: `src/pages/RecordStatsPage.tsx`**

Add match header component at the top:
- Team badges (home team initials + opponent initials)
- Score input fields (sets won/lost)
- Set score pills (25-21, etc.) - editable
- Match metadata (date, time, location)
- "Log Stats" button placement in header area

**New Component: `src/components/match-stats/MatchStatsHeader.tsx`**

Props:
```typescript
interface MatchStatsHeaderProps {
  event: EventWithDetails;
  setsWon: number;
  setsLost: number;
  setScores: string[];
  onScoreChange: (setsWon: number, setsLost: number) => void;
  onSetScoresChange: (setScores: string[]) => void;
}
```

---

## Phase 2: Quick Stats Summary Bar

**New Component: `src/components/match-stats/QuickStatsSummary.tsx`**

Display live calculated team totals:
- Team Kills (green when high)
- Kill % (teal)
- Aces
- Blocks
- Digs
- Pass Rating (gold/warning color)
- Errors (red)

Props:
```typescript
interface QuickStatsSummaryProps {
  totals: TeamTotals;
}
```

---

## Phase 3: View Toggle & Player Card View

**New Component: `src/components/match-stats/ViewToggle.tsx`**

Simple toggle button group:
- "Player Cards" (card view)
- "Spreadsheet" (table view)

**New Component: `src/components/match-stats/PlayerSelector.tsx`**

Horizontal scrollable list of player chips:
- Avatar initials
- Player name
- Jersey number
- Active state highlight

Props:
```typescript
interface PlayerSelectorProps {
  players: PlayerStatRow[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}
```

**New Component: `src/components/match-stats/PlayerStatsCard.tsx`**

Individual player stats display with:
- Player header (avatar, name, position, jersey number)
- Navigation arrows (prev/next player)
- 6 stat category cards arranged in grid

Props:
```typescript
interface PlayerStatsCardProps {
  player: PlayerStatRow;
  playerInfo: { name: string; position?: string; jerseyNumber?: string };
  onStatChange: (field: keyof PlayerStatRow, value: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
}
```

---

## Phase 4: Stat Category Cards

**New Component: `src/components/match-stats/StatCategoryCard.tsx`**

Reusable card for each stat category:
- Header with icon and category name
- Colored top border (category-specific)
- List of stat input rows
- Calculated value display at bottom

Props:
```typescript
interface StatCategoryCardProps {
  title: string;
  icon: string;
  color: string;
  stats: Array<{
    label: string;
    shortLabel: string;
    field: keyof PlayerStatRow;
    value: number;
  }>;
  calculatedStat?: {
    label: string;
    value: string;
    status: 'good' | 'average' | 'poor' | 'neutral';
  };
  onStatChange: (field: keyof PlayerStatRow, value: number) => void;
}
```

**New Component: `src/components/match-stats/StatInputRow.tsx`**

Individual stat input with +/- buttons:
- Label
- Minus button (red tint)
- Value display
- Plus button (green tint)

Props:
```typescript
interface StatInputRowProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
}
```

---

## Phase 5: Stat Categories Configuration

Define the 6 stat categories with their colors and stats:

```typescript
const STAT_CATEGORIES = [
  {
    id: 'attack',
    title: 'Attack',
    icon: 'Swords', // lucide icon
    color: '#22C55E', // green
    stats: [
      { label: 'Kills', shortLabel: 'K', field: 'kills' },
      { label: 'Attack Errors', shortLabel: 'E', field: 'attackErrors' },
      { label: 'Attack Attempts', shortLabel: 'TA', field: 'attackAttempts' },
    ],
    calculated: {
      label: 'Kill Percentage',
      compute: (row) => row.attackAttempts > 0
        ? ((row.kills - row.attackErrors) / row.attackAttempts * 100).toFixed(1) + '%'
        : '—',
    },
  },
  {
    id: 'serve',
    title: 'Serve',
    icon: 'Target',
    color: '#E63946', // club red
    stats: [
      { label: 'Aces', shortLabel: 'A', field: 'aces' },
      { label: 'Service Errors', shortLabel: 'SE', field: 'serviceErrors' },
      { label: 'Serve Attempts', shortLabel: 'SA', field: 'serveAttempts' },
    ],
    calculated: {
      label: 'Ace Percentage',
      compute: (row) => row.serveAttempts > 0
        ? (row.aces / row.serveAttempts * 100).toFixed(1) + '%'
        : '—',
    },
  },
  {
    id: 'block',
    title: 'Block',
    icon: 'Shield',
    color: '#3B82F6', // blue
    stats: [
      { label: 'Block Solos', shortLabel: 'BS', field: 'blockSolos' },
      { label: 'Block Assists', shortLabel: 'BA', field: 'blockAssists' },
      { label: 'Block Touches', shortLabel: 'BT', field: 'blockTouches' },
    ],
    calculated: {
      label: 'Total Blocks',
      compute: (row) => (row.blockSolos + row.blockAssists * 0.5).toString(),
    },
  },
  {
    id: 'defense',
    title: 'Defense',
    icon: 'Volleyball', // or custom
    color: '#9333EA', // purple
    stats: [
      { label: 'Digs', shortLabel: 'D', field: 'digs' },
      { label: 'Ball Handling Errors', shortLabel: 'BHE', field: 'ballHandlingErrors' },
    ],
  },
  {
    id: 'passing',
    title: 'Passing / Receive',
    icon: 'Hands',
    color: '#2EC4B6', // teal
    stats: [
      { label: 'Pass Attempts', shortLabel: 'PA', field: 'passAttempts' },
      { label: 'Pass Sum (0-3 each)', shortLabel: 'PS', field: 'passSum' },
    ],
    calculated: {
      label: 'Pass Rating',
      compute: (row) => row.passAttempts > 0
        ? (row.passSum / row.passAttempts).toFixed(2)
        : '—',
    },
  },
  {
    id: 'setting',
    title: 'Setting',
    icon: 'Hand',
    color: '#FFB703', // gold
    stats: [
      { label: 'Set Attempts', shortLabel: 'SA', field: 'setAttempts' },
      { label: 'Set Sum (0-3 each)', shortLabel: 'SS', field: 'setSum' },
      { label: 'Setting Errors', shortLabel: 'SE', field: 'settingErrors' },
    ],
    calculated: {
      label: 'Set Rating',
      compute: (row) => row.setAttempts > 0
        ? (row.setSum / row.setAttempts).toFixed(2)
        : '—',
    },
  },
];
```

---

## Phase 6: Playing Time Card

**New Component: `src/components/match-stats/PlayingTimeCard.tsx`**

Separate card for playing time stats:
- Starting Rotation (dropdown 1-6)
- Sets Played (+/- counter)
- Rotations Played (+/- counter)

---

## Phase 7: Action Bar

**New Component: `src/components/match-stats/ActionBar.tsx`**

Sticky bottom action bar:
- Left: Save status indicator (green dot + "All changes saved" or yellow dot + "Saving...")
- Right: Cancel button, Save All button, Finalize Match button (green)

Props:
```typescript
interface ActionBarProps {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onCancel: () => void;
  onSaveAll: () => void;
  onFinalize: () => void;
  canFinalize: boolean;
}
```

---

## Phase 8: Spreadsheet View Enhancement

Enhance the existing spreadsheet view to match wireframe:
- Add category header row with colored backgrounds
- Style inputs to match wireframe (darker bg, compact)
- Add calculated columns (K%, Pass Rating, Set Rating)
- Style footer row for team totals
- Sticky player column on horizontal scroll

---

## Phase 9: Integration & State Management

**Modify: `src/pages/RecordStatsPage.tsx`**

1. Add state for:
   - `viewMode: 'card' | 'spreadsheet'`
   - `selectedPlayerId: string | null`
   - `hasUnsavedChanges: boolean`
   - `saveStatus: 'saved' | 'saving' | 'unsaved'`

2. Add breadcrumb navigation at top

3. Integrate all new components

4. Add debounced auto-save (optional enhancement)

5. Update navigation: "Log Stats" button from EventDetailPage hero should link here

---

## Phase 10: EventDetailPage Update

**Modify: `src/pages/EventDetailPage.tsx`**

Update the match header buttons section:
- Move "Record Stats" button to be more prominent (renamed to "Log Stats")
- Show button for game/tournament events that are not finalized
- Button should navigate to `/events/${id}/stats`

---

## Files Summary

### New Files (8)
| File | Description |
|------|-------------|
| `src/components/match-stats/MatchStatsHeader.tsx` | Match header with scores and team badges |
| `src/components/match-stats/QuickStatsSummary.tsx` | Live team totals summary bar |
| `src/components/match-stats/ViewToggle.tsx` | Card/Spreadsheet view toggle |
| `src/components/match-stats/PlayerSelector.tsx` | Horizontal player chip selector |
| `src/components/match-stats/PlayerStatsCard.tsx` | Individual player stats card |
| `src/components/match-stats/StatCategoryCard.tsx` | Stat category card with inputs |
| `src/components/match-stats/PlayingTimeCard.tsx` | Playing time inputs card |
| `src/components/match-stats/ActionBar.tsx` | Sticky bottom action bar |
| `src/components/match-stats/index.ts` | Barrel exports |

### Modified Files (2)
| File | Changes |
|------|---------|
| `src/pages/RecordStatsPage.tsx` | Complete UI overhaul to match wireframe |
| `src/pages/EventDetailPage.tsx` | Update "Record Stats" button placement and styling |

---

## Component Hierarchy

```
RecordStatsPage
├── Breadcrumb
├── MatchStatsHeader
│   ├── Team badges
│   ├── Score inputs
│   └── Set score pills
├── QuickStatsSummary
├── ViewToggle
├── [Card View]
│   ├── PlayerSelector
│   └── PlayerStatsCard
│       ├── Player header + navigation
│       ├── StatCategoryCard (Attack)
│       ├── StatCategoryCard (Serve)
│       ├── StatCategoryCard (Block)
│       ├── StatCategoryCard (Defense)
│       ├── StatCategoryCard (Passing)
│       ├── StatCategoryCard (Setting)
│       └── PlayingTimeCard
├── [Spreadsheet View]
│   └── Enhanced Table
└── ActionBar
```

---

## Verification Plan

1. **Visual Comparison**
   - Compare against wireframe at match-stats-wireframe.html
   - Check all stat categories render correctly
   - Verify color scheme matches

2. **Functionality Tests**
   - +/- buttons increment/decrement correctly
   - View toggle switches between card and spreadsheet
   - Player selector highlights active player
   - Navigation arrows cycle through players
   - Calculated values update in real-time
   - Save functionality works for individual rows and save all
   - Data persists after page reload

3. **Mobile Responsiveness**
   - Player selector scrolls horizontally
   - Stat categories stack on mobile
   - Spreadsheet has horizontal scroll
   - Action bar stays visible

4. **Integration Tests**
   - Navigate from EventDetailPage "Log Stats" button
   - Breadcrumb links work
   - Cancel returns to event detail
   - Finalize triggers confirmation and redirects

---

## Implementation Order

1. Create component folder structure and barrel exports
2. Build StatInputRow component (smallest unit)
3. Build StatCategoryCard component
4. Build PlayerStatsCard component
5. Build PlayerSelector component
6. Build QuickStatsSummary component
7. Build MatchStatsHeader component
8. Build ViewToggle component
9. Build PlayingTimeCard component
10. Build ActionBar component
11. Integrate all components into RecordStatsPage
12. Update EventDetailPage button placement
13. Polish and test
