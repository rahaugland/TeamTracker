# Shared Component Examples

This document shows examples of using the shared reusable components from the VolleyQuest coach wireframes.

## StatCard

Displays a metric with optional delta indicator and colored top accent.

```tsx
import { StatCard } from '@/components/dashboard';

// Example 1: Attendance rate with positive trend
<StatCard
  label="Attendance Rate"
  value="87%"
  delta="+3.2% vs last month"
  deltaType="positive"
  accent="success"
/>

// Example 2: Win rate
<StatCard
  label="Win Rate"
  value="72%"
  delta="+8% vs last season"
  deltaType="positive"
  accent="primary"
/>

// Example 3: Active players (neutral)
<StatCard
  label="Active Players"
  value={16}
  delta="of 18 registered"
  deltaType="neutral"
  accent="secondary"
/>

// Example 4: Clickable stat card
<StatCard
  label="Next Match"
  value="3 days"
  delta="vs Bergen VBK"
  deltaType="neutral"
  accent="teal"
  onClick={() => navigate('/schedule')}
/>
```

**Props:**
- `label` (string): Uppercase label text
- `value` (string | number): Main value to display
- `delta?` (string): Optional delta/subtitle text
- `deltaType?` ('positive' | 'negative' | 'neutral'): Determines delta color
- `accent?` ('success' | 'primary' | 'secondary' | 'teal' | 'gray'): Top border color
- `onClick?` (function): Makes card clickable
- `className?` (string): Additional CSS classes

## ScheduleItem

Displays an event in a schedule list with date badge and type indicator.

```tsx
import { ScheduleItem } from '@/components/schedule';

// Example 1: Today's practice
<ScheduleItem
  day="03"
  month="Feb"
  title="Team Practice"
  meta="Lambertseter Hall, 18:00"
  type="practice"
  isToday={true}
  onClick={() => navigate('/event/123')}
/>

// Example 2: Upcoming match
<ScheduleItem
  day="06"
  month="Feb"
  title="vs Bergen VBK"
  meta="Ekeberg Hallen, 19:00"
  type="match"
  onClick={() => navigate('/match/456')}
/>

// Example 3: Regular practice (not clickable)
<ScheduleItem
  day="08"
  month="Feb"
  title="Team Practice"
  meta="Lambertseter Hall, 18:00"
  type="practice"
/>
```

**Props:**
- `day` (string): Day number (e.g., "03")
- `month` (string): Month abbreviation (e.g., "Feb")
- `title` (string): Event title
- `meta` (string): Location and time info
- `type` ('match' | 'practice'): Event type
- `isToday?` (boolean): Highlights as today's event
- `onClick?` (function): Makes item clickable
- `className?` (string): Additional CSS classes

## PlayerAvatar

Circular avatar displaying player initials or image, with optional position tag.

```tsx
import { PlayerAvatar } from '@/components/player';

// Example 1: Small avatar with initials
<PlayerAvatar
  initials="EH"
  size="sm"
/>

// Example 2: Medium avatar with position tag
<PlayerAvatar
  initials="SN"
  position="S"
  size="md"
/>

// Example 3: Large avatar with image and position
<PlayerAvatar
  initials="KL"
  imageUrl="/avatars/kristian.jpg"
  position="MB"
  size="lg"
/>
```

**Props:**
- `initials` (string): Player initials (fallback if no image)
- `imageUrl?` (string): Optional profile image URL
- `position?` (string): Position abbreviation (e.g., "OH", "S", "MB")
- `size?` ('sm' | 'md' | 'lg'): Avatar size (default: 'sm')
- `className?` (string): Additional CSS classes

## RSVPStatusBadge

Status badge for RSVP responses.

```tsx
import { RSVPStatusBadge } from '@/components/common';

// Example 1: Coming
<RSVPStatusBadge status="coming" />

// Example 2: Not coming
<RSVPStatusBadge status="not-coming" />

// Example 3: Pending
<RSVPStatusBadge status="pending" />

// Example 4: Custom label
<RSVPStatusBadge
  status="coming"
  label="Confirmed"
/>
```

**Props:**
- `status` ('coming' | 'not-coming' | 'pending'): RSVP status
- `label?` (string): Custom label (defaults to status text)
- `className?` (string): Additional CSS classes

## TodayEventCard

Hero card displaying today's event with RSVP summary.

```tsx
import { TodayEventCard } from '@/components/dashboard';

// Example usage
<TodayEventCard
  title="Team Practice"
  location="Lambertseter Hall"
  time="18:00 - 20:00"
  rsvpSummary={{
    coming: 12,
    notComing: 2,
    pending: 4,
  }}
  onViewDetails={() => navigate('/event/today')}
/>

// Without action button
<TodayEventCard
  title="Team Practice"
  location="Lambertseter Hall"
  time="18:00 - 20:00"
  rsvpSummary={{
    coming: 12,
    notComing: 2,
    pending: 4,
  }}
/>
```

**Props:**
- `title` (string): Event title
- `location` (string): Event location
- `time` (string): Event time
- `rsvpSummary` (object): RSVP counts
  - `coming` (number): Number coming
  - `notComing` (number): Number not coming
  - `pending` (number): Number pending
- `onViewDetails?` (function): Optional click handler for details button
- `className?` (string): Additional CSS classes

## Usage in Pages

### Dashboard Example

```tsx
import { StatCard, TodayEventCard } from '@/components/dashboard';
import { ScheduleItem } from '@/components/schedule';

function CoachDashboard() {
  return (
    <div className="space-y-6">
      {/* Today's Event */}
      <TodayEventCard
        title="Team Practice"
        location="Lambertseter Hall"
        time="18:00 - 20:00"
        rsvpSummary={{ coming: 12, notComing: 2, pending: 4 }}
        onViewDetails={() => navigate('/event/today')}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Attendance Rate"
          value="87%"
          delta="+3.2% vs last month"
          deltaType="positive"
          accent="success"
        />
        <StatCard
          label="Win Rate"
          value="72%"
          delta="+8% vs last season"
          deltaType="positive"
          accent="primary"
        />
        <StatCard
          label="Active Players"
          value={16}
          delta="of 18 registered"
          accent="secondary"
        />
        <StatCard
          label="Next Match"
          value="3 days"
          delta="vs Bergen VBK"
          accent="teal"
        />
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <ScheduleItem
          day="03"
          month="Feb"
          title="Team Practice"
          meta="Lambertseter Hall, 18:00"
          type="practice"
          isToday={true}
        />
        <ScheduleItem
          day="06"
          month="Feb"
          title="vs Bergen VBK"
          meta="Ekeberg Hallen, 19:00"
          type="match"
        />
      </div>
    </div>
  );
}
```

### Player List Example

```tsx
import { PlayerAvatar } from '@/components/player';
import { RSVPStatusBadge } from '@/components/common';

function PlayerList({ players }) {
  return (
    <div className="space-y-2">
      {players.map(player => (
        <div key={player.id} className="flex items-center justify-between p-4 bg-navy-90 rounded-lg">
          <div className="flex items-center gap-3">
            <PlayerAvatar
              initials={player.initials}
              imageUrl={player.avatar}
              position={player.position}
              size="md"
            />
            <div>
              <p className="font-semibold">{player.name}</p>
              <p className="text-sm text-gray-400">{player.fullPosition}</p>
            </div>
          </div>
          <RSVPStatusBadge status={player.rsvpStatus} />
        </div>
      ))}
    </div>
  );
}
```
