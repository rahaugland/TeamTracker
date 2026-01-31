# Attendance Tracking

Complete guide to tracking player attendance and analyzing attendance patterns in TeamTracker.

## Overview

TeamTracker provides a comprehensive attendance system with RSVP (before events) and actual attendance tracking (after events). This dual system helps coaches plan effectively and track player commitment.

## Key Concepts

### RSVP vs. Attendance

**RSVP (Response)**
- Set **before** an event
- Indicates **intention** to attend
- Helps coaches plan
- Players/parents can set

**Attendance (Actual)**
- Recorded **after** an event
- Records **actual** attendance
- Used for statistics
- Only coaches can mark

### Why Track Both?

The two-stage system provides valuable insights:

- **Planning**: RSVP helps coaches prepare
- **Accountability**: Compare RSVP vs. actual
- **Patterns**: Identify reliability issues
- **Communication**: Follow up with no-shows

## RSVP System

### RSVP Statuses

Players and parents can set four RSVP statuses:

#### Attending
Player plans to attend.

**When to use:**
- Confirmed availability
- Committed to attending
- No conflicts expected

#### Not Attending
Player cannot attend.

**When to use:**
- Schedule conflict
- Illness (known in advance)
- Personal commitment
- Travel plans

#### Maybe
Player is uncertain.

**When to use:**
- Tentative conflict
- Waiting on other plans
- Depends on circumstances
- Need more information

#### Pending
No response yet (default).

**Status:**
- Player hasn't responded
- Invitation not seen
- Needs follow-up

### Setting RSVP (Players & Parents)

1. Navigate to **Schedule** or **Dashboard**
2. Open the event
3. Click **Set RSVP**
4. Select status:
   - Attending
   - Not Attending
   - Maybe
5. Add optional note (e.g., "Will be 15 minutes late")
6. Click **Save**

**Tips:**
- RSVP as early as possible
- Update if plans change
- Add context in notes
- Check schedule regularly

### Viewing RSVP Status

**For Players:**
- See your own RSVP on event page
- Status badge on schedule view
- Dashboard shows upcoming RSVPs

**For Coaches:**
- See all player RSVPs on event page
- Summary counts by status
- List of non-responders
- Filter by RSVP status

### RSVP Best Practices

**For Players:**
- RSVP within 24 hours of event creation
- Update immediately if plans change
- Be honest about availability
- Add notes for partial attendance

**For Parents:**
- Coordinate with child before RSVPing
- Check regularly for new events
- Update for schedule conflicts
- Communicate absences early

**For Coaches:**
- Set RSVP deadline (e.g., 2 days before)
- Follow up with non-responders
- Use RSVP data for planning
- Don't penalize honest "Not Attending"

## Attendance Marking

### Attendance Statuses

Coaches record actual attendance with four statuses:

#### Present
Player attended the event.

**When to use:**
- Player showed up on time
- Stayed for full event
- Participated normally

#### Absent
Player did not attend.

**When to use:**
- No-show
- Didn't communicate absence
- Unexcused absence

#### Late
Player arrived late.

**When to use:**
- Arrived after start time
- Participated after arrival
- Partial attendance

**Tip:** Add note with arrival time

#### Excused
Absence was excused.

**When to use:**
- Illness
- Family emergency
- School conflict
- Pre-approved absence

### Marking Attendance (Coaches)

#### Individual Marking

1. Navigate to event detail page
2. Click **Mark Attendance**
3. For each player, select status:
   - Present
   - Absent
   - Late
   - Excused
4. Add notes if needed (optional)
5. Click **Save**

**Tips:**
- Mark immediately after event
- Be consistent with statuses
- Use notes for context
- Save frequently

#### Bulk Actions

**Mark All Present:**
1. Click **Mark All Present** button
2. All players marked as present
3. Adjust individual statuses as needed
4. Save

**Use when:**
- Perfect attendance
- Large roster
- Quick marking needed

#### Comparing RSVP to Attendance

The attendance marking screen shows RSVP status alongside attendance:

**Visual indicators:**
- Green: RSVP'd attending and present
- Red: RSVP'd attending but absent
- Gray: RSVP'd not attending
- Yellow: Maybe or pending RSVP

**Benefits:**
- Identify no-shows
- Follow up on surprises
- Track reliability
- Address patterns

### Attendance Notes

Add notes to attendance records:

**Common uses:**
- Late arrival time: "Arrived 15 min late"
- Early departure: "Left at 5:30pm for family event"
- Partial participation: "Injured, did not scrimmage"
- Excused reason: "Doctor appointment"

**Best practices:**
- Be specific and factual
- Include timestamps for late/early
- Document patterns
- Keep professional

## Viewing Attendance

### Individual Player Attendance

View a player's attendance history:

1. Navigate to **Players**
2. Select player
3. View **Attendance** tab

**Information shown:**
- Attendance percentage
- Total events: Present, Absent, Late, Excused
- Recent attendance history
- Attendance trend graph
- Comparison to team average

### Team Attendance Overview

View team-wide attendance:

1. Navigate to **Dashboard** or **Analytics**
2. Select team
3. Choose date range

**Metrics displayed:**
- Average team attendance %
- Attendance trend (up/down/stable)
- Perfect attendance players
- Low attendance alerts
- Attendance by event type

### Attendance Analytics

Access detailed analytics:

1. Navigate to **Analytics**
2. Select **Attendance** view
3. Filter by:
   - Team
   - Date range
   - Event type
   - Player

**Available views:**
- Player comparison table
- Attendance trend graph
- Event type breakdown
- RSVP accuracy analysis

## Attendance Policies

### Setting Expectations

Coaches should communicate:

- **RSVP requirements**: When to RSVP by
- **Attendance expectations**: Required attendance %
- **Excused absences**: What qualifies
- **Communication protocol**: How to notify absences
- **Consequences**: Playing time, roster status

### Tracking Patterns

Monitor for:

- **Chronic late arrivals**: Address individually
- **Low RSVP accuracy**: Players who often don't show
- **Declining trends**: Attendance dropping over time
- **Event type patterns**: Skipping specific types

### Addressing Issues

When addressing attendance problems:

1. **Review data**: Check attendance history
2. **Private conversation**: Discuss with player/parent
3. **Understand context**: Ask about challenges
4. **Set expectations**: Clarify requirements
5. **Follow up**: Monitor improvement
6. **Document**: Keep coach notes

## Importing Historical Attendance

### From Spond

Import historical attendance from Spond:

1. Export attendance CSV from Spond
2. Navigate to **Import** in TeamTracker
3. Upload CSV file
4. Map columns (Player Name, Date, Status)
5. Review and import

See [Import Documentation](../import-feature.md) for details.

### Manual Entry

For small datasets:

1. Create past events
2. Mark attendance for each
3. Build historical record

**Tip:** Only import significant events to save time.

## Permissions

### Role-Based Access

| Action | Head Coach | Assistant Coach | Player | Parent |
|--------|-----------|-----------------|--------|---------|
| Set RSVP | Yes | Yes | Yes (self) | Yes (child) |
| Mark attendance | Yes | Yes | No | No |
| View own attendance | Yes | Yes | Yes | Yes (child) |
| View team attendance | Yes | Yes | No | No |
| View analytics | Yes | Yes | No | No |
| Export data | Yes | Yes | No | No |

## Reporting

### Attendance Reports

Generate attendance reports:

**Currently:** View in analytics dashboard

**Future:** Export to PDF/Excel planned

**Available data:**
- Individual player summaries
- Team attendance rates
- Event-by-event breakdown
- Trend analysis
- RSVP vs. actual comparison

### Sharing Reports

**With players:**
- Share personal attendance %
- Discuss improvement goals
- Celebrate perfect attendance

**With parents:**
- Provide attendance summaries
- Discuss patterns or concerns
- Set expectations

**With administration:**
- Program evaluation
- Funding justification
- Season reports

## Mobile Attendance

### On-the-Go Marking

Mobile-optimized for marking at events:

**Features:**
- Large touch targets
- Quick status toggle
- Swipe gestures
- Offline capable
- Auto-save

**Tips:**
- Mark during breaks
- Use bulk actions first
- Add notes voice-to-text
- Sync before leaving

### Offline Marking

Mark attendance without internet:

1. Open event page (loads from cache)
2. Mark attendance normally
3. Changes saved locally
4. Syncs when back online
5. Check sync indicator

**Perfect for:**
- Gyms without WiFi
- Remote fields
- Tournament venues
- Travel situations

## Best Practices

### For Coaches

**Before Events:**
- Check RSVP status
- Follow up with non-responders
- Plan based on expected attendance
- Adjust activities if low turnout

**During Events:**
- Note arrival times
- Track participation
- Document issues
- Prepare for marking

**After Events:**
- Mark attendance immediately
- Add relevant notes
- Compare to RSVP
- Follow up on no-shows

### For Players

**RSVP:**
- Respond early
- Be honest
- Update changes
- Add context

**Attendance:**
- Arrive on time
- Stay full duration
- Notify absences
- Communicate conflicts

### For Parents

**Communication:**
- Check schedule regularly
- RSVP promptly
- Update for changes
- Contact coach for absences

**Monitoring:**
- Review child's attendance
- Address patterns
- Support commitment
- Celebrate consistency

## Troubleshooting

### RSVP Not Showing

**Problem:** Can't see RSVP option

**Solutions:**
- Verify event is upcoming
- Check you're on team
- Refresh the page
- Check permissions

### Attendance Not Saving

**Problem:** Marked attendance disappears

**Solutions:**
- Ensure you clicked Save
- Check sync status
- Wait for offline sync
- Verify event exists
- Try again

### Wrong Attendance Count

**Problem:** Percentages seem incorrect

**Solutions:**
- Check date range filter
- Verify all events marked
- Look for archived events
- Recalculate manually
- Contact administrator

### Can't Mark Attendance

**Problem:** Mark Attendance button not visible

**Solutions:**
- Verify you're a coach
- Check event hasn't been deleted
- Ensure event occurred
- Try from event detail page
- Refresh page

## Integration with Other Features

### With Schedule

- Events must exist to track attendance
- RSVP ties to scheduled events
- Calendar view shows RSVP status
- See [Schedule Documentation](./SCHEDULE.md)

### With Analytics

- Attendance data feeds dashboards
- Trend analysis requires history
- Comparison tools use percentages
- Export options for deeper analysis

### With Teams

- Attendance tracked per team
- Player history across teams
- Team membership affects visibility
- See [Teams Documentation](./TEAMS.md)

## Future Enhancements

Planned features:

- **Automated reminders**: RSVP and attendance prompts
- **Attendance streaks**: Consecutive event tracking
- **Predictive RSVP**: Based on patterns
- **Export options**: PDF, Excel, CSV reports
- **Attendance rewards**: Gamification for players
- **Real-time RSVP updates**: Live event dashboards

## Related Documentation

- [Schedule & Events](./SCHEDULE.md)
- [Teams & Roster](./TEAMS.md)
- [Analytics](../USER_GUIDE.md#using-analytics)
- [Import Feature](../import-feature.md)

---

*Last updated: January 2026*
