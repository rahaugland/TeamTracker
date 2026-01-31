# Teams & Roster Management

Complete guide to managing teams, seasons, and player rosters in TeamTracker.

## Overview

TeamTracker organizes players into teams within seasons, enabling continuous player tracking across multiple time periods. This structure allows you to manage multiple teams per season while maintaining comprehensive player histories.

## Concepts

### Seasons

A **season** represents a time period for organizing teams (e.g., "Fall 2024", "Spring 2025").

**Key features:**
- Multiple teams per season
- One active season at a time
- Archive old seasons to declutter
- Players maintain continuity across seasons

### Teams

A **team** is a group of players within a season.

**Key features:**
- Multiple coaches per team
- Continuous player profiles
- Team-specific schedules and events
- Unique invite codes for joining

### Team Memberships

**Team memberships** link players to teams with role and jersey information.

**Key features:**
- Track when players join/leave
- Assign jersey numbers
- Designate team captains
- View player history across teams

## Managing Seasons

### Creating a Season

**Who can do this:** Head coaches

1. Navigate to **Teams** or **Settings**
2. Click **Add Season**
3. Enter season details:
   - **Name**: Descriptive name (e.g., "Fall 2024", "Spring Season 2025")
   - **Start Date**: When the season begins
   - **End Date**: When the season ends
4. Toggle **Active** to make it your current season
5. Click **Save**

**Tips:**
- Use consistent naming conventions (e.g., "Fall 2024", "Winter 2025")
- Set realistic date ranges
- Only one season can be active at a time

### Managing Active Season

The **active season** is the current season you're working in.

**To change active season:**
1. Navigate to season list
2. Find the season you want to activate
3. Click **Set as Active**
4. Previous active season becomes inactive

**Effects of changing:**
- Default team selection changes
- Dashboard shows active season data
- New teams created in active season

### Archiving Seasons

Archive old seasons to keep your workspace clean while preserving data.

**To archive:**
1. Navigate to season list
2. Find the season to archive
3. Click **Archive**
4. Confirm archival

**Archived seasons:**
- Hidden from main views
- Data fully preserved
- Can be unarchived anytime
- Still accessible via search/filters

### Deleting Seasons

**Warning:** Deleting a season removes ALL associated data permanently.

**To delete:**
1. Navigate to season list
2. Find the season to delete
3. Click **Delete Season**
4. Confirm deletion (this cannot be undone)

**What gets deleted:**
- All teams in the season
- All events and schedules
- All attendance records
- All RSVP data
- Player profiles are NOT deleted (they're continuous)

**Recommendation:** Archive instead of delete unless you're certain.

## Managing Teams

### Creating a Team

**Who can do this:** Head coaches

**Prerequisites:**
- At least one season created
- One season marked as active

**Steps:**
1. Navigate to **Teams**
2. Click **Add Team**
3. Enter team information:
   - **Team Name**: Descriptive name (e.g., "Varsity Girls", "U16 Boys")
   - **Season**: Select from dropdown (defaults to active season)
4. Click **Save**

**Tips:**
- Use clear, distinguishable names
- Include age group or level if managing multiple teams
- Consider naming conventions: "[Level] [Gender] [Age]"

### Viewing Team Details

1. Navigate to **Teams**
2. Click on a team card
3. View team details:
   - Team name and season
   - Roster (all players)
   - Coaches
   - Invite code
   - Statistics

### Editing Team Information

**Who can do this:** Head coaches

1. Navigate to team detail page
2. Click **Edit Team**
3. Update team name or season
4. Click **Save**

**Note:** Changing a team's season moves all associated events and data.

### Deleting Teams

**Who can do this:** Head coaches

**Warning:** This removes all team data permanently.

**To delete:**
1. Navigate to team detail page
2. Click **Delete Team**
3. Confirm deletion

**What gets deleted:**
- Team record
- All events for this team
- All attendance records
- All practice plans
- Team memberships (players remain in system)

## Managing Roster

### Adding Players

#### Method 1: Create New Player and Add to Team

1. Navigate to **Players**
2. Click **Add Player**
3. Fill in player information:
   - **Name** (required)
   - **Email** (optional)
   - **Phone** (optional)
   - **Birth Date** (optional)
   - **Positions** (select one or more)
   - **Photo URL** (optional)
4. Click **Save**
5. From player profile, click **Add to Team**
6. Select:
   - Team
   - Jersey Number
   - Role (Player or Captain)
7. Click **Save**

#### Method 2: Import from CSV

1. Navigate to **Import**
2. Follow import wizard to bulk add players
3. See [Import Documentation](../import-feature.md)

### Assigning Jersey Numbers

Jersey numbers are assigned when adding players to teams:

1. Open player profile
2. Click **Add to Team** (or edit existing membership)
3. Enter jersey number
4. Save

**Tips:**
- Numbers typically range from 1-99
- Ensure no duplicate numbers on same team
- Players can have different numbers on different teams

### Designating Team Captains

1. Open player profile
2. Find team membership
3. Edit membership
4. Change role from **Player** to **Captain**
5. Save

**Captain benefits:**
- Visual indicator on roster
- Recognition in team views
- Future features may add captain privileges

### Removing Players from Teams

**This does NOT delete the player**, just removes them from the specific team.

1. Open player profile
2. Find the team membership section
3. Click **Remove from Team**
4. Confirm removal

**Effects:**
- Player removed from team roster
- Historical attendance/stats preserved
- Player profile remains in system
- Can be re-added later

### Tracking Player Departures

Mark why and when players leave mid-season:

1. Edit team membership
2. Set **Left At** date
3. Select **Departure Reason**:
   - Quit
   - Injury
   - Cut
   - Other
4. Toggle **Is Active** off
5. Save

**Benefits:**
- Clear historical record
- Understand roster turnover
- Can filter inactive players from views

## Team Invite Codes

Share unique codes with players and parents to let them join your team.

### Viewing Team Code

1. Navigate to team detail page
2. Find **Team Invite Code** section
3. Code is displayed (e.g., "ABC123")

### Sharing the Code

1. Click **Copy Code** to copy to clipboard
2. Share via:
   - Text message
   - Email
   - Team group chat
   - Printed handout

### Regenerating Codes

If a code is compromised or shared publicly:

1. Click **Regenerate Code**
2. Confirm regeneration
3. **Old code immediately stops working**
4. Share new code with team

**When to regenerate:**
- Code accidentally shared publicly
- Security concerns
- Former team member has code
- Reset at season end

## Player Profiles

### Continuous Player History

Players maintain a single profile across all teams and seasons.

**Benefits:**
- Track player development over time
- View complete attendance history
- Maintain coach notes across seasons
- Analyze multi-season trends

### Viewing Player History

1. Open any player profile
2. View sections:
   - **Current Teams**: Active team memberships
   - **Past Teams**: Historical memberships
   - **Attendance History**: All-time attendance
   - **Statistics**: Performance data (when available)

### Coach Notes

Private notes visible only to coaches on the player's teams.

**To add note:**
1. Open player profile
2. Navigate to **Notes** tab
3. Click **Add Note**
4. Enter note content
5. Add tags (optional): "attitude", "skill-development", etc.
6. Save

**Best practices:**
- Be constructive and professional
- Tag for easy searching
- Regular updates during season
- Use for development tracking

## Multi-Team Management

### Managing Multiple Teams

Head coaches can manage multiple teams simultaneously.

**Strategies:**
- Use clear naming conventions
- Set team-specific schedules
- Track attendance separately
- Share drills across teams

### Players on Multiple Teams

Players can be members of multiple teams at once.

**How it works:**
- One player profile
- Multiple team memberships
- Different jersey numbers per team
- Separate attendance records
- Combined stats in profile

**Example:** Sarah is on "Varsity Girls" (#12) and "Club Team" (#7)

### Cross-Team Roster Copying

Copy players from one team to another:

1. Create new team
2. Navigate to players
3. For each player:
   - Open profile
   - Click **Add to Team**
   - Select new team
   - Set new jersey number

**Tip:** Use CSV import for bulk roster copying

## Permissions

### Role-Based Access

| Action | Head Coach | Assistant Coach | Player | Parent |
|--------|-----------|-----------------|--------|---------|
| Create season | Yes | No | No | No |
| Create team | Yes | No | No | No |
| Edit team | Yes | No | No | No |
| Delete team | Yes | No | No | No |
| Add players | Yes | Yes | No | No |
| Edit players | Yes | Yes | No | No |
| Remove players | Yes | Yes | No | No |
| View roster | Yes | Yes | Team only | Child only |
| Coach notes | Yes | Yes | No | No |
| Invite codes | Yes | Yes | No | No |

## Best Practices

### Season Planning

- Create next season before current ends
- Use consistent naming: "[Season] [Year]"
- Set accurate date ranges
- Archive old seasons annually

### Team Organization

- Limit to 3-5 active teams per season
- Use descriptive team names
- Document team levels/ages
- Keep roster size manageable (12-18 players)

### Roster Management

- Add all players before first event
- Assign jersey numbers early
- Mark captains at season start
- Update player info as it changes
- Track departures with reasons

### Data Hygiene

- Archive old seasons annually
- Remove duplicate player profiles
- Update inactive memberships
- Clean up test data
- Regular coach note reviews

### Communication

- Share invite codes via multiple channels
- Remind team to join before first event
- Send code to parents of younger players
- Update codes if compromised
- Verify all players joined

## Troubleshooting

### Can't Create Team

**Problem:** "No active season" error

**Solution:**
1. Create a season first
2. Mark it as active
3. Try creating team again

### Player Appears Twice

**Problem:** Duplicate player profiles

**Solution:**
1. Identify the duplicate
2. Remove from teams
3. Delete duplicate profile
4. Add correct profile to teams

### Team Code Not Working

**Problem:** "Invalid team code" error

**Solutions:**
- Verify code has no typos or spaces
- Check if code was regenerated
- Get fresh code from coach
- Try entering code again

### Can't Remove Player

**Problem:** Remove button not visible

**Solution:**
- Verify you're a coach
- Check you're on correct team page
- Try from player profile instead
- Refresh the page

### Lost Team Data

**Problem:** Team or season missing

**Solutions:**
- Check if season is archived
- Verify you're in correct account
- Look in season filter/dropdown
- Contact administrator

## Related Documentation

- [Schedule & Events](./SCHEDULE.md)
- [Attendance Tracking](./ATTENDANCE.md)
- [User Guide](../USER_GUIDE.md)
- [Quick Start Guide](../QUICK_START.md)

---

*Last updated: January 2026*
