# TeamTracker Frequently Asked Questions

## General Questions

### What is TeamTracker?

TeamTracker is a volleyball team management application designed for coaches to manage rosters, track attendance, plan practices, and analyze team performance. It works offline and syncs across devices.

### Who can use TeamTracker?

TeamTracker supports four user roles:
- **Head Coaches**: Full management access
- **Assistant Coaches**: Practice and planning access
- **Players**: Schedule viewing and RSVP
- **Parents**: View child's schedule and RSVP on their behalf

### Is TeamTracker free?

Pricing information should be obtained from your team administrator or the TeamTracker website.

### What platforms does TeamTracker support?

TeamTracker is a web application that works on:
- Mobile browsers (iOS Safari, Android Chrome)
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Can be installed as a Progressive Web App (PWA) on any device

### Do I need an account?

Yes, all users need to create an account using Google Sign-In.

---

## Account Management

### How do I create an account?

1. Navigate to TeamTracker
2. Click "Sign in with Google"
3. Authenticate with your Google account
4. Select your role (coach, player, or parent)

### Can I use a different email provider?

Currently, TeamTracker only supports Google Sign-In for simplicity and security. You can create a free Google account if you don't have one.

### How do I change my role?

Contact your head coach to change your role. Roles determine your permissions and cannot be self-modified.

### How do I change my email address?

Email addresses are tied to your Google account and cannot be changed within TeamTracker. You would need to create a new account with a different Google account.

### How do I delete my account?

Contact your head coach to request account deletion. Under GDPR, you have the right to have your data deleted.

### I forgot my password. How do I reset it?

TeamTracker uses Google Sign-In, so there are no passwords to remember. Use Google's account recovery if you can't access your Google account.

---

## Teams & Seasons

### What's the difference between a team and a season?

- **Season**: A time period (e.g., "Fall 2024", "Spring 2025")
- **Team**: A group of players within a season (e.g., "Varsity Girls")

Seasons help organize teams by time, and you can have multiple teams per season.

### How do I create a team?

(Head coaches only)
1. First, create a season and mark it active
2. Navigate to Teams
3. Click Add Team
4. Enter name and select season
5. Save

### How many teams can I create?

There's no hard limit, but we recommend keeping it manageable (1-5 teams per season).

### Can a player be on multiple teams?

Yes, players can be members of multiple teams simultaneously. They maintain a single profile across all teams.

### How do I archive a season?

1. Navigate to the season list
2. Click on the season
3. Toggle "Active" off or select "Archive"
4. Archived seasons are hidden from main views but data is retained

### Can I delete a season?

Head coaches can delete seasons, but this will remove all teams, events, and data associated with that season. Consider archiving instead.

---

## Roster Management

### How do I add players to my team?

1. Navigate to Players
2. Click Add Player
3. Fill in player information
4. Save player
5. Open player profile and click "Add to Team"
6. Select team and enter jersey number

### Can I import players from another system?

Yes, use the Import feature to upload a CSV file with player and attendance data from Spond or similar systems.

### How do I remove a player from a team?

1. Open the player's profile
2. Find the team membership
3. Click Remove from Team
4. Confirm removal

Note: This doesn't delete the player, just removes them from that specific team.

### What happens when a player quits mid-season?

Mark them as inactive in their team membership. Their data is preserved for historical records and they can be reactivated if they return.

### How do I permanently delete a player?

Contact your head coach. Player deletion removes all associated data (attendance, stats, notes) and cannot be undone.

---

## Joining Teams

### How do I join a team as a player?

1. Get the team invite code from your coach
2. Navigate to Join Team
3. Enter the code
4. Review team details
5. Click Join Team

### I entered the code but it says "Invalid"

- Double-check the code for typos
- Ensure there are no extra spaces
- Ask your coach for a new code
- The code may have been regenerated

### Can I join multiple teams?

Yes, you can use different invite codes to join multiple teams.

### How do I leave a team?

Contact your coach to be removed from the team roster.

---

## Schedule & Events

### How do I view my schedule?

Navigate to Schedule or Dashboard to see all upcoming events for your team(s).

### What are event types?

- **Practice**: Regular team practice
- **Game**: Competitive match
- **Tournament**: Multi-game event
- **Meeting**: Team meeting
- **Other**: Miscellaneous events

### Can I add events to my personal calendar?

Currently, you can view events in TeamTracker. Manual export to external calendars is not yet supported.

### Who can create events?

Head coaches and assistant coaches can create events.

### Can I edit an event after creating it?

Yes, coaches can edit events at any time. Changes sync to all team members.

### Can I delete an event?

Yes, coaches can delete events. This will remove all associated RSVPs and attendance data.

---

## RSVP & Attendance

### What's the difference between RSVP and attendance?

- **RSVP**: Response before an event (Will you attend?)
- **Attendance**: Actual record after an event (Did you attend?)

### How do I RSVP to an event?

1. Open the event from your schedule
2. Click Set RSVP
3. Choose: Attending, Not Attending, Maybe, or Pending
4. Save

### Can I change my RSVP?

Yes, you can update your RSVP anytime before the event.

### Who can mark attendance?

Only coaches can mark actual attendance after events.

### What do attendance statuses mean?

- **Present**: Player attended
- **Absent**: Player didn't show
- **Late**: Player arrived late
- **Excused**: Absence was excused

### Why is my RSVP different from my attendance?

RSVP is your plan; attendance is what actually happened. Players might RSVP "Attending" but be marked "Absent" if they don't show up.

---

## Practice Planning

### Who can create practice plans?

Head coaches and assistant coaches.

### What is a drill?

A drill is a practice exercise or activity in your drill library. Drills can be categorized by skill, difficulty level, and equipment needs.

### How do I create a practice plan?

1. First, build your drill library
2. Navigate to Practices
3. Click Create Practice Plan
4. Add blocks (warmup, drills, scrimmage, cooldown)
5. Set duration for each block
6. Save

### Can I reuse practice plans?

Yes, save plans as templates and reuse them for future practices.

### What are progression levels?

Drills are rated 1-5 based on difficulty:
- 1: Beginner
- 2: Intermediate
- 3: Advanced intermediate
- 4: Advanced
- 5: Elite

### How does drill progression work?

When a team successfully executes a drill multiple times (rated 3+ stars), the system suggests advancing to the next level drill in the progression chain.

---

## Import & Export

### What can I import?

Currently, you can import attendance data from Spond CSV exports.

### How do I export data from Spond?

1. Open Spond app
2. Navigate to your team
3. Go to Statistics or Attendance section
4. Export as CSV
5. Upload to TeamTracker Import page

### What CSV format is required?

Required columns:
- Player Name
- Date
- Attendance Status

Optional columns:
- Email
- Event Title
- Event Type
- Location

### Can I export data from TeamTracker?

Export functionality is planned for future releases.

---

## Offline Usage

### Does TeamTracker work offline?

Yes! TeamTracker is designed to work fully offline. All data is stored on your device and syncs when you're back online.

### How do I know if I'm offline?

Check the sync status indicator in the top navigation:
- Green: Online and synced
- Yellow: Syncing
- Gray: Offline
- Red: Sync error

### What happens to changes made offline?

All changes are saved locally and automatically sync when you reconnect to the internet.

### Will I lose data if I'm offline?

No, all data is stored on your device. Changes sync automatically when you're back online.

### How do I force a sync?

Click the sync status indicator and select "Sync Now".

### What if two people edit the same thing offline?

TeamTracker uses "last write wins" conflict resolution. The most recent change (by timestamp) is kept.

---

## Analytics

### Who can view analytics?

Coaches (head and assistant) can view analytics. Players and parents see their own stats only.

### What analytics are available?

- Attendance percentages by player
- Attendance trends over time
- Team attendance overview
- Drill usage statistics
- Practice planning insights

### How is attendance percentage calculated?

(Number of events attended / Total events) × 100

### Can I compare players?

Yes, the analytics dashboard shows comparative attendance rates and stats across players.

### Can I export analytics data?

Export functionality is planned for future releases.

---

## Privacy & Security

### Is my data secure?

Yes, TeamTracker uses:
- Encrypted connections (HTTPS)
- Secure authentication (Google OAuth)
- Role-based access control
- Regular security updates

### Who can see my data?

- **Coaches**: See all team data
- **Players**: See own data and team schedule
- **Parents**: See linked child's data and schedule

### What are coach notes?

Private notes that coaches can write about players. Only coaches on the same team can view these notes.

### Can I request my data?

Yes, under GDPR you have the right to request a copy of all your data. Contact your head coach.

### How do I delete my data?

Contact your head coach to request data deletion. Your data will be permanently removed within 30 days.

### How long is data retained?

- Active data: Kept while you're on a team
- Archived seasons: Retained unless deletion requested
- Deleted data: Permanently removed within 30 days

---

## Technical Issues

### The app won't load

1. Check your internet connection
2. Clear browser cache
3. Try a different browser
4. Sign out and sign back in
5. Check if you're using a supported browser

### Changes aren't saving

1. Check sync status indicator
2. Ensure you clicked Save button
3. Wait for sync if offline
4. Try refreshing the page
5. Check browser console for errors

### I can't see certain features

Some features are role-specific:
- Drills/Practices: Coaches only
- User Management: Head coaches only
- Analytics: Coaches only

Verify your role in Profile settings.

### The app is slow

1. Check your internet connection
2. Close unused browser tabs
3. Clear browser cache
4. Reduce number of open pages
5. Try a different browser

### Photos won't display

1. Ensure URL is publicly accessible
2. Use direct image links (.jpg, .png, etc.)
3. Try a different image host
4. Check image URL is valid

### Import is failing

1. Verify CSV file format
2. Map all required columns
3. Check date formats are valid
4. Review error messages
5. Try importing smaller batches

---

## Mobile Usage

### How do I install the app on my phone?

**iOS:**
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Name it and tap Add

**Android:**
1. Open in Chrome
2. Tap menu (three dots)
3. Tap "Add to Home screen"
4. Name it and tap Add

### Does the mobile app work offline?

Yes, the mobile PWA works fully offline just like the desktop version.

### Can I get push notifications?

Push notifications are planned for future releases.

### Do I need to download anything?

No downloads required. TeamTracker is a web app that can be added to your home screen.

---

## Best Practices

### How often should I take attendance?

Mark attendance after every event while it's fresh in your memory.

### When should players RSVP?

As soon as they know their availability, ideally within 24 hours of event creation.

### How do I organize my drill library?

- Use clear, descriptive names
- Tag with appropriate skills
- Set progression levels
- Link progression chains
- Add notes and video URLs

### Should I archive or delete old seasons?

Archive old seasons to keep historical data. Only delete if you're certain you won't need the data.

### How can I improve attendance?

- Create events in advance
- Monitor RSVP status
- Follow up with non-responders
- Review attendance analytics for patterns

---

## Getting Help

### Where can I find more help?

- Read the [User Guide](./USER_GUIDE.md)
- Check the [Quick Start Guide](./QUICK_START.md)
- Review feature documentation in the docs/features folder
- Contact your head coach
- Report bugs to your team administrator

### How do I report a bug?

Contact your head coach or team administrator with:
- What you were doing when the error occurred
- Error messages (if any)
- Browser and device information
- Steps to reproduce the issue

### How do I request a new feature?

Share your feature ideas with your coach or team administrator.

---

*Last updated: January 2026*
