# TeamTracker User Guide

Welcome to TeamTracker, the comprehensive volleyball team management application designed for coaches, players, and parents.

## Table of Contents

1. [Getting Started](#getting-started)
2. [For Coaches](#for-coaches)
3. [For Players](#for-players)
4. [For Parents](#for-parents)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Navigate to the TeamTracker application
2. Click "Sign in with Google" on the login page
3. Authenticate with your Google account
4. Select your role:
   - **Head Coach**: Full access to manage teams, players, and schedules
   - **Assistant Coach**: Help manage practices and view team information
   - **Player**: View schedules, RSVP to events, and track your stats
   - **Parent**: View your child's schedule and manage RSVPs

### Understanding Roles

Your role determines what you can access and do in TeamTracker:

| Role | Capabilities |
|------|-------------|
| Head Coach | Create teams/seasons, manage roster, create events, take attendance, build practice plans, view all analytics, manage users |
| Assistant Coach | View team data, create events, take attendance, build practice plans, view analytics (no user management) |
| Player | View own schedule, RSVP to events, view personal stats |
| Parent | View child's schedule, RSVP on behalf of child, view child's stats |

### Installing the App

TeamTracker is a Progressive Web App (PWA) that works like a native app:

**On Mobile (iOS/Android):**
1. Open TeamTracker in your mobile browser
2. Look for the "Add to Home Screen" prompt
3. Tap "Add" to install
4. Launch from your home screen like any other app

**On Desktop:**
1. Open TeamTracker in Chrome, Edge, or Safari
2. Click the install icon in the address bar
3. Click "Install"
4. Launch from your applications menu

### Offline Mode

TeamTracker works fully offline:
- All data is stored on your device
- Make changes without internet
- Changes sync automatically when you're back online
- Check the sync status indicator in the top navigation

---

## For Coaches

### Creating Your First Season

Seasons help you organize your teams by time period (e.g., "Fall 2024", "Spring 2025").

1. Navigate to **Settings** or **Teams**
2. Click **Add Season**
3. Enter:
   - Season name (e.g., "Fall 2024")
   - Start date
   - End date
4. Toggle **Active** to make it your current season
5. Click **Save**

**Tips:**
- Only one season can be active at a time
- Archive old seasons to keep your workspace clean
- Players and data carry over across seasons

### Creating Teams

1. Ensure you have an active season
2. Navigate to **Teams**
3. Click **Add Team**
4. Enter team name (e.g., "Varsity Girls", "U16 Boys")
5. Select the season
6. Click **Save**

### Managing Your Roster

#### Adding Players

1. Go to **Players** in the navigation
2. Click **Add Player**
3. Fill in player information:
   - **Name** (required)
   - **Email** (optional, for notifications)
   - **Phone** (optional)
   - **Birth Date** (optional)
   - **Positions** (select one or more)
   - **Photo URL** (optional)
4. Click **Save**

#### Adding Players to Teams

1. Open a player's profile
2. Click **Add to Team**
3. Select:
   - Team
   - Jersey number
   - Role (Player or Captain)
4. Click **Save**

#### Managing Player Information

- **Edit**: Click on any player to view their profile, then click **Edit**
- **Remove from team**: In the player profile, find the team membership and click **Remove**
- **Add coach notes**: In player profile, navigate to the Notes tab (coach-only)
- **View history**: See all teams and seasons a player has been part of

#### Team Invite Codes

Share invite codes with players and parents to let them join your team:

1. Navigate to **Team Detail** page
2. Find the **Team Invite Code** section
3. Click **Copy Code** to copy to clipboard
4. Share the code with your team members
5. Click **Regenerate Code** if the code is compromised

**Note:** Regenerating a code makes the old code invalid.

### Creating the Schedule

#### Adding Events

1. Navigate to **Schedule**
2. Click **Add Event**
3. Fill in event details:
   - **Type**: Practice, Game, Tournament, Meeting, or Other
   - **Title**: Event name
   - **Start Time** and **End Time**
   - **Location** (optional)
   - **Opponent** (for games)
   - **Notes** (optional)
4. Click **Save**

#### Calendar Views

Switch between List and Calendar views:
- **List View**: See all events in chronological order
- **Calendar View**: Month or week view with color-coded events

#### Event Types & Colors

Events are color-coded by type:
- Practice: Blue
- Game: Red
- Tournament: Purple
- Meeting: Green
- Other: Gray

### Taking Attendance

#### Before the Event (RSVP)

Players and parents can RSVP before events. You can view RSVP status on the event detail page.

#### After the Event (Actual Attendance)

1. Navigate to the **Event Detail** page
2. Click **Mark Attendance**
3. For each player, select:
   - **Present**: Player attended
   - **Absent**: Player didn't show
   - **Late**: Player arrived late
   - **Excused**: Excused absence
4. Add notes if needed
5. Click **Save**

**Quick actions:**
- **Mark All Present**: Quickly mark everyone present
- **Filter by RSVP**: See who said they'd come

### Building Practice Plans

#### Creating a Drill Library

Build your personal drill library:

1. Navigate to **Drills**
2. Click **Add Drill**
3. Fill in drill information:
   - **Name**: Drill name
   - **Description**: How to run the drill
   - **Skills**: Select volleyball skills (passing, setting, hitting, etc.)
   - **Progression Level**: 1-5 (beginner to advanced)
   - **Min/Max Players**: Player requirements
   - **Equipment**: What you'll need
   - **Duration**: Estimated time
   - **Video URL** (optional): Link to demonstration video
4. Click **Save**

#### Drill Progression Chains

Link drills to create progression paths:

1. Edit a drill
2. Select **Parent Drill** to link to an easier version
3. When players master a drill (3+ successful executions), you'll see suggestions to advance

#### Creating Practice Plans

1. Navigate to **Practices**
2. Click **Create Practice Plan**
3. Enter plan name
4. Add blocks:
   - **Warmup**: Pre-practice warmup
   - **Drill**: Select from your drill library
   - **Scrimmage**: Game play
   - **Cooldown**: Post-practice cooldown
   - **Break**: Rest period
   - **Custom**: Free-form block
5. Set duration for each block
6. Drag blocks to reorder
7. Click **Save**

**Tips:**
- Total duration is calculated automatically
- Save plans as templates for reuse
- Attach plans to practice events

#### Tracking Drill Execution

After running drills in practice:

1. Open the drill detail page
2. Click **Mark as Executed**
3. Rate the execution (1-5 stars)
4. Add notes
5. Track execution history to identify mastery

### Using Analytics

#### Attendance Overview

View attendance patterns for your team:

1. Navigate to **Dashboard** or **Analytics**
2. Select date range (Last 7 days, Last 30 days, This season)
3. View:
   - Average attendance percentage
   - Attendance trends
   - Per-player attendance rates
   - Perfect attendance highlights

#### Drill Usage Statistics

See which drills you use most:

- **Most used drills**: Frequency and ratings
- **Recent executions**: Track what you've practiced
- **Progression readiness**: Players ready to advance

### Importing Data from Spond

Migrate your historical attendance data:

1. Navigate to **Import** in the navigation
2. **Step 1 - Upload**:
   - Select the team
   - Upload your Spond CSV export
3. **Step 2 - Map Columns**:
   - Map CSV columns to TeamTracker fields
   - Required: Player Name, Date, Status
   - Optional: Email, Event Title, Event Type, Location
4. **Step 3 - Review**:
   - Review summary statistics
   - Choose options:
     - Create missing players automatically
     - Create missing events automatically
5. **Step 4 - Import**:
   - Watch progress as data imports
6. **Step 5 - Complete**:
   - Review results
   - Import another file or view schedule

**Exporting from Spond:**
1. Open Spond app
2. Go to your team
3. Navigate to Statistics or Attendance
4. Export as CSV
5. Upload to TeamTracker

### Managing Users

Head coaches can manage user roles and team memberships:

1. Navigate to **Users** (head coaches only)
2. View all users with their roles and teams
3. **Change role**: Click on a user, select new role
4. **Remove from team**: Click remove icon next to team name
5. **Search/Filter**: Find users by name, email, or role

---

## For Players

### Joining a Team

1. Get the team invite code from your coach
2. Navigate to **Join Team**
3. Enter the code
4. Click **Find Team**
5. Review team information
6. Click **Join Team**

### Viewing Your Schedule

1. Navigate to **Schedule** or **Dashboard**
2. View upcoming events
3. See event details:
   - Type (Practice, Game, etc.)
   - Date and time
   - Location
   - Your RSVP status

### RSVPing to Events

Let your coach know if you can attend:

1. Open an event from your schedule
2. Click **Set RSVP**
3. Select:
   - **Attending**: You'll be there
   - **Not Attending**: You can't make it
   - **Maybe**: You're uncertain
4. Add a note if needed (optional)
5. Click **Save**

**Tips:**
- RSVP as early as possible
- Update your RSVP if plans change
- Coaches can see RSVP status when planning

### Viewing Your Stats

1. Navigate to **Dashboard** or **My Profile**
2. View:
   - Attendance percentage
   - Attendance history
   - Teams you're on
   - Personal information

### Updating Your Profile

1. Navigate to **Profile**
2. Update:
   - Name
   - Phone number
   - Avatar/photo
3. Click **Save**

**Note:** Email cannot be changed (tied to your account). Contact your coach to change your role.

---

## For Parents

### Linking to Your Child's Profile

1. Navigate to **Dashboard**
2. Click **Link Player**
3. Search for your child's name
4. Select the player
5. Click **Confirm**

**Tips:**
- You can link multiple children
- Ask your coach if you can't find your child's profile
- Once linked, you can RSVP on their behalf

### Viewing Your Child's Schedule

1. Navigate to **Dashboard**
2. If you have multiple children, select which one to view
3. See their upcoming events

### RSVPing for Your Child

1. Open an event from your child's schedule
2. Click **Set RSVP**
3. Select attendance status
4. Add a note if needed
5. Click **Save**

### Viewing Your Child's Stats

From the dashboard, view:
- Attendance percentage
- Teams they're on
- Attendance history

---

## Common Tasks

### Switching Languages

TeamTracker supports English and Norwegian:

1. Navigate to **Settings**
2. Select **Language**
3. Choose **English** or **Norwegian**
4. Interface updates immediately

### Checking Sync Status

Look for the sync indicator in the top navigation:
- **Online**: Connected and synced
- **Offline**: Working offline, changes will sync later
- **Syncing**: Currently syncing changes
- **Synced**: All changes saved to cloud
- **Sync Error**: Problem syncing (check connection)

### Managing Offline Data

TeamTracker stores data locally:
- View pending changes count in sync indicator
- Click **Sync Now** to force a sync
- All changes are saved even without internet

### Signing Out

1. Click your profile icon
2. Select **Sign Out**
3. Confirm sign out

**Note:** Signing out doesn't delete local data. You can sign back in anytime.

---

## Troubleshooting

### Can't Join a Team

**Problem**: "Invalid team code" error

**Solutions:**
- Double-check the code with your coach
- Ensure there are no extra spaces
- Ask coach to regenerate code if it's old

### Missing Players

**Problem**: Can't find a player in the roster

**Solutions:**
- Check if you're viewing the correct team
- Search by full name
- Ask head coach to check if player was added
- Player may be on a different team/season

### Attendance Not Saving

**Problem**: Attendance changes aren't persisting

**Solutions:**
- Check sync status indicator
- Ensure you clicked "Save" button
- If offline, wait for sync when back online
- Try refreshing the page

### RSVP Not Showing

**Problem**: RSVP status not visible to coach

**Solutions:**
- Ensure you're looking at the correct event
- Check that RSVP was saved (look for confirmation)
- Wait for sync if offline
- Try refreshing the page

### Import Errors

**Problem**: CSV import failing

**Solutions:**
- Ensure file is in CSV format (not Excel)
- Check that required columns are mapped
- Verify date format is recognized
- Review error messages for specific issues
- Try importing a smaller subset first

### Can't Create Events/Teams

**Problem**: "No active season" error

**Solutions:**
- Create a season first
- Set a season as active
- Check that you have coach permissions

### Data Not Syncing

**Problem**: Changes not appearing on other devices

**Solutions:**
- Check internet connection
- Look at sync status indicator
- Click "Sync Now" manually
- Sign out and sign back in
- Clear browser cache and reload

### Profile Photo Not Showing

**Problem**: Player or profile photo won't display

**Solutions:**
- Ensure URL is publicly accessible
- Use direct image links (ending in .jpg, .png, etc.)
- Try a different image hosting service
- Image may take time to load

### Permission Denied

**Problem**: "You don't have permission" error

**Solutions:**
- Verify your role (check Profile page)
- Ask head coach to update your role if incorrect
- Some features are coach-only
- Sign out and sign back in

---

## Getting Help

### Contact Your Coach

For team-specific questions:
- Joining teams
- Player profiles
- Schedule conflicts
- Role changes

### Technical Issues

If you encounter bugs or technical problems:
1. Note what you were doing when the problem occurred
2. Check the troubleshooting section above
3. Try signing out and back in
4. Clear browser cache
5. Try a different browser
6. Contact your team administrator

### Feature Requests

TeamTracker is continuously improving. Share your ideas for new features with your coach or team administrator.

---

## Best Practices

### For Coaches

- **Regular updates**: Update attendance after every event
- **Early scheduling**: Create events in advance so players can RSVP
- **Use progressions**: Build drill libraries with progression chains
- **Monitor attendance**: Check RSVP status before events
- **Backup data**: Periodically export important information
- **Clean roster**: Mark players inactive when they leave

### For Players

- **RSVP promptly**: Respond to events as soon as possible
- **Update changes**: Change RSVP if your plans change
- **Keep profile current**: Update contact information
- **Check schedule**: Review upcoming events regularly

### For Parents

- **Link early**: Link to your child's profile right away
- **Coordinate RSVPs**: Check with your child before responding
- **Monitor attendance**: Review your child's attendance patterns
- **Update contacts**: Keep phone/email current

---

## Privacy & Data

### What Data is Collected

TeamTracker collects:
- Name, email, phone (optional)
- Team memberships
- Attendance records
- RSVP responses
- Coach notes (coach-only, private)

### Your Rights

- **View your data**: Access all your information in Profile
- **Update data**: Edit your profile anytime
- **Delete data**: Request full deletion from your coach
- **Export data**: Request a copy of your data

### Data Retention

- Active data: Kept while you're on a team
- Archived seasons: Kept unless deletion requested
- Deleted data: Permanently removed within 30 days

### Security

- All data encrypted in transit and at rest
- Social login (no passwords to manage)
- Role-based access control
- Regular security updates

---

## Glossary

**Attendance**: Record of who showed up to an event

**Coach Notes**: Private notes coaches can write about players

**Drill**: A volleyball practice exercise or activity

**Event**: A scheduled occurrence (practice, game, tournament, meeting)

**Progression**: A series of drills that increase in difficulty

**RSVP**: Response to an event invitation (will you attend?)

**Season**: A time period for organizing teams (e.g., Fall 2024)

**Sync**: Uploading local changes to the cloud and downloading updates

**Team**: A group of players managed together

**Team Membership**: A player's association with a specific team

---

*Last updated: January 2026*
