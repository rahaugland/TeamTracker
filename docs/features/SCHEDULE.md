# Schedule & Events

Complete guide to creating, managing, and viewing team schedules and events in TeamTracker.

## Overview

The schedule feature allows coaches to create and manage team events including practices, games, tournaments, and meetings. Players and parents can view schedules and RSVP to events.

## Event Types

TeamTracker supports five event types:

### Practice
Regular team training sessions.

**Typical use:**
- Weekly practices
- Extra training sessions
- Skill-specific practices

**Features:**
- Link to practice plans
- Attendance tracking
- RSVP system

### Game
Competitive matches against other teams.

**Typical use:**
- League games
- Scrimmages
- Playoff matches

**Features:**
- Opponent field
- Score tracking (future)
- Stats entry (future)

### Tournament
Multi-game events spanning multiple days.

**Typical use:**
- Weekend tournaments
- Championship events
- Invitational competitions

**Features:**
- Extended duration
- Multiple games
- Location tracking

### Meeting
Team meetings and events.

**Typical use:**
- Parent meetings
- Team discussions
- Planning sessions

**Features:**
- Agenda notes
- RSVP tracking

### Other
Miscellaneous team events.

**Typical use:**
- Team bonding
- Community service
- Social events

## Creating Events

### Who Can Create Events

- Head coaches
- Assistant coaches

### Basic Event Creation

1. Navigate to **Schedule**
2. Click **Add Event**
3. Fill in required fields:
   - **Type**: Select event type
   - **Title**: Event name
   - **Start Time**: Date and time event begins
   - **End Time**: Date and time event ends
4. Fill in optional fields:
   - **Location**: Where event takes place
   - **Opponent**: For games (opponent team name)
   - **Notes**: Additional information
5. Click **Save**

**Tips:**
- Use descriptive titles: "Tuesday Practice", "vs. Eagles"
- Include location for away games
- Add notes for special instructions
- Set realistic time ranges

### Creating Recurring Events

**Currently:** Create each event individually

**Future:** Recurring event templates planned

**Workaround:**
1. Create first event
2. Duplicate by creating similar events
3. Adjust dates and details

### Linking Practice Plans

Attach practice plans to practice events:

1. Create or edit a practice event
2. In practice plan section, select plan from dropdown
3. Save event

**Benefits:**
- Players can preview practice structure
- Track drill usage
- Reuse successful plans

## Viewing the Schedule

### Calendar Views

TeamTracker offers two schedule views:

#### List View
Chronological list of all events.

**Features:**
- Shows all upcoming events
- Sortable by date
- Filterable by type
- Good for mobile

**How to use:**
1. Navigate to **Schedule**
2. Click **List View** toggle
3. Scroll through events
4. Click event for details

#### Calendar View
Month or week grid view.

**Features:**
- Visual month overview
- Color-coded by event type
- Tap/click to open details
- Good for desktop

**How to use:**
1. Navigate to **Schedule**
2. Click **Calendar View** toggle
3. Navigate between months
4. Click event for details

### Event Color Coding

Events are color-coded by type:

- **Practice**: Blue
- **Game**: Red
- **Tournament**: Purple
- **Meeting**: Green
- **Other**: Gray

### Filtering Events

Filter events by:

- **Event type**: Show only specific types
- **Date range**: Custom date filters
- **Team**: If you manage multiple teams

### Searching Events

Use the search bar to find events by:
- Event title
- Location
- Opponent name
- Notes content

## Managing Events

### Editing Events

**Who can edit:** Coaches who created event or head coaches

1. Open event detail page
2. Click **Edit Event**
3. Update any fields
4. Click **Save**

**Changes sync immediately** to all users.

### Deleting Events

**Who can delete:** Coaches who created event or head coaches

**Warning:** Deleting removes all RSVPs and attendance data.

1. Open event detail page
2. Click **Delete Event**
3. Confirm deletion

**Recommendation:** Consider marking events as cancelled in notes instead of deleting.

### Cancelling Events

**Best practice:** Edit event and add "[CANCELLED]" to title and note in description.

**Future:** Dedicated cancellation status planned.

### Rescheduling Events

1. Open event detail page
2. Click **Edit Event**
3. Update start and end times
4. Update location if needed
5. Add note about reschedule
6. Save

**All RSVPs are preserved** but users may need to update availability.

## Event Details

### Event Information Display

Event detail pages show:

**Basic Info:**
- Event type icon and label
- Title
- Date and time
- Duration
- Location
- Opponent (if game)

**Participation:**
- RSVP summary
- Attendance summary (after event)
- Player list with status

**Additional:**
- Notes
- Linked practice plan (if any)
- Created by and timestamp

### Event Navigation

From event detail page:

- **Edit**: Modify event
- **Delete**: Remove event
- **Mark Attendance**: Record who showed up
- **Set RSVP**: Respond to event (players/parents)
- **View Practice Plan**: See attached plan

## RSVP System

### How RSVP Works

Before an event, players and parents can indicate their availability.

**RSVP Statuses:**
- **Attending**: Will be there
- **Not Attending**: Cannot make it
- **Maybe**: Uncertain
- **Pending**: No response yet

### Setting RSVP (Players & Parents)

1. Open event from schedule
2. Click **Set RSVP**
3. Select status
4. Add optional note (reason for absence, etc.)
5. Click **Save**

**Tips:**
- RSVP as early as possible
- Update if plans change
- Add notes for context
- Check regularly for new events

### Viewing RSVP Status (Coaches)

On event detail page, see:

- **RSVP Summary**: Count by status
- **Player List**: Individual RSVP statuses
- **Response Rate**: Percentage who responded
- **Non-Responders**: Who hasn't RSVP'd

**Use this to:**
- Plan practice activities
- Know expected attendance
- Follow up with non-responders
- Adjust plans if low turnout

### RSVP Reminders

**Currently:** Manual follow-up

**Future:** Automated reminders planned

**Workaround:** Message non-responders directly

## Permissions

### Role-Based Access

| Action | Head Coach | Assistant Coach | Player | Parent |
|--------|-----------|-----------------|--------|---------|
| Create event | Yes | Yes | No | No |
| Edit event | Yes | Yes | No | No |
| Delete event | Yes | Yes* | No | No |
| View schedule | Yes | Yes | Team only | Child's team only |
| RSVP | Yes | Yes | Yes | Yes (for child) |
| Mark attendance | Yes | Yes | No | No |

*Assistant coaches can only delete events they created

## Best Practices

### Event Planning

- **Schedule in advance**: Create events 1-2 weeks ahead
- **Consistent timing**: Keep practices same day/time when possible
- **Clear titles**: Use "Practice - Tuesday" not just "Practice"
- **Include location**: Always add location, especially for away games
- **Add details**: Use notes for special instructions

### Schedule Management

- **Regular updates**: Keep schedule current
- **Avoid gaps**: Don't leave long periods unscheduled
- **Balance types**: Mix practices, games, and rest
- **Season view**: Plan full season at start
- **Archive old**: Clean up past events periodically

### RSVP Management

- **Set expectations**: Require RSVPs by certain time
- **Follow up**: Contact non-responders
- **Track patterns**: Note chronic non-responders
- **Adjust plans**: Use RSVP data for practice planning
- **Communicate changes**: Notify team of schedule changes

### Communication

- **Create early**: Give players advance notice
- **Update promptly**: Make changes ASAP
- **Note changes**: Document rescheduling reasons
- **Highlight important**: Mark key games/tournaments
- **Share externally**: Players can add to personal calendars

## Mobile Usage

### Schedule on Mobile

The schedule is optimized for mobile:

**Features:**
- Touch-friendly event cards
- Swipe between views
- Easy RSVP access
- Offline schedule viewing

**Tips:**
- Add app to home screen
- Check schedule weekly
- RSVP immediately
- Enable offline mode

### Quick Actions

On mobile, common actions are easily accessible:

- **Tap event**: Open details
- **Tap RSVP**: Quick status change
- **Swipe**: Navigate calendar
- **Pull down**: Refresh schedule

## Offline Functionality

### What Works Offline

- View all scheduled events
- Set RSVPs (sync when online)
- View event details
- Create new events (coaches)
- Edit existing events (coaches)

### What Requires Online

- Viewing other users' RSVPs (initially)
- Real-time updates
- New event sync to other users

### Sync Behavior

- Changes made offline are queued
- Sync occurs automatically when online
- Conflict resolution: last write wins
- Check sync indicator for status

## Troubleshooting

### Can't Create Event

**Problem:** Add Event button not visible

**Solutions:**
- Verify you're a coach
- Check you have active team
- Ensure active season exists
- Try refreshing page

### Event Not Showing

**Problem:** Created event doesn't appear

**Solutions:**
- Check date filters
- Verify correct team selected
- Look in calendar view
- Check if offline (sync pending)
- Try refreshing page

### RSVP Not Saving

**Problem:** RSVP status resets

**Solutions:**
- Ensure you clicked Save
- Check sync status
- Wait for offline sync
- Try again
- Verify event still exists

### Wrong Time Zone

**Problem:** Event times appear incorrect

**Solutions:**
- Check device time zone settings
- Verify event was created in correct zone
- Edit event to correct time
- Note time zone in event details

### Can't Edit Event

**Problem:** Edit button not visible

**Solutions:**
- Verify you're a coach
- Check if you created event (assistant coaches)
- Ensure event hasn't passed
- Try as head coach

## Integration with Other Features

### Practice Plans

Events can link to practice plans:

1. Create practice plan
2. Create practice event
3. Link plan to event
4. Players can preview structure

See [Practice Plans Documentation](./PRACTICE_PLANS.md)

### Attendance

After events, mark actual attendance:

1. Event occurs
2. Coach marks attendance
3. Compare RSVP vs. attendance
4. Track patterns over time

See [Attendance Documentation](./ATTENDANCE.md)

### Analytics

Schedule data feeds analytics:

- Attendance trends
- RSVP patterns
- Event type distribution
- Peak practice times

## Future Enhancements

Planned features:

- **Recurring events**: Template-based creation
- **Calendar export**: iCal/Google Calendar sync
- **Push notifications**: Event reminders
- **Cancellation status**: Dedicated cancelled state
- **RSVP reminders**: Automatic follow-ups
- **Weather integration**: Weather forecasts for outdoor events

## Related Documentation

- [Attendance Tracking](./ATTENDANCE.md)
- [Practice Plans](./PRACTICE_PLANS.md)
- [Teams & Roster](./TEAMS.md)
- [User Guide](../USER_GUIDE.md)

---

*Last updated: January 2026*
