# RSVP System and Offline Support Implementation

This document describes the implementation of the RSVP system and offline support features for TeamTracker.

## Feature 1: RSVP System

### RSVP Service (src/services/rsvp.service.ts)

Complete implementation with the following functions:

- **getEventRSVPs(eventId)** - Get all RSVPs for an event with player details
- **getPlayerRSVPs(playerId)** - Get a player's RSVP history
- **getRSVP(eventId, playerId)** - Get a specific RSVP
- **submitRSVP(input)** - Create/update RSVP using upsert
- **deleteRSVP(eventId, playerId)** - Delete an RSVP
- **getRSVPSummary(eventId)** - Get RSVP counts by status

**Input interface:**
```typescript
{
  event_id: string;
  player_id: string;
  status: 'attending' | 'not_attending' | 'maybe' | 'pending';
  responded_by: string;
  note?: string;
}
```

### EventDetailPage Integration

The RSVP section has been fully integrated into the EventDetailPage (src/pages/EventDetailPage.tsx):

- Displays RSVP summary (X attending, Y not attending, Z maybe, W pending)
- Shows each player's RSVP status
- Coaches can update RSVPs on behalf of players
- Clean UI with status dropdowns for each player
- Located before the attendance section

### Database

The RSVPs table is already set up in the database with all necessary fields and a unique constraint on (event_id, player_id).

## Feature 2: Offline Support

### Dexie.js Setup

**Dependencies installed:**
- dexie: ^4.2.1
- dexie-react-hooks: ^4.2.0

### Offline Database (src/lib/offline-db.ts)

Complete Dexie schema mirroring Supabase tables:

**Tables:**
- seasons
- teams
- players
- team_memberships
- events
- rsvps
- attendance_records
- drills
- practice_plans
- practice_blocks
- coach_notes

**Sync metadata fields:**
- _synced: boolean
- _lastModified: timestamp
- _deleted: boolean (for soft deletes)

**Helper functions:**
- addSyncMetadata() - Add sync fields to records
- softDelete() - Mark record as deleted
- getUnsyncedRecords() - Get pending changes
- markAsSynced() - Mark records as synced
- clearAllData() - Clear database on logout
- getSyncStatus() - Get sync statistics

### Sync Service (src/services/sync.service.ts)

Bidirectional sync with last-write-wins conflict resolution:

**Functions:**
- **syncToLocal(userId)** - Pull data from Supabase to IndexedDB
- **syncToRemote()** - Push local changes to Supabase
- **performSync(userId)** - Full bidirectional sync
- **startAutoSync(userId, interval)** - Auto-sync on interval
- **stopAutoSync()** - Stop auto-sync
- **subscribeSyncStatus(listener)** - Subscribe to sync events
- **getSyncStatus()** - Get current sync status
- **isOnline()** - Check network status

**Sync strategy:**
1. Push local changes first
2. Then pull remote changes
3. Auto-sync every 2 minutes when online
4. Manual sync via UI button

### Offline Hooks (src/hooks/useOffline.ts)

**useOnlineStatus()** - Returns boolean for network status

**useSyncStatus()** - Returns:
- synced: boolean (true if all synced)
- syncing: boolean (true during sync)
- error: boolean (true if sync failed)
- offline: boolean (true if no network)
- pendingCount: number (unsynced changes)
- lastSync: timestamp | null

**useLastSyncFormatted()** - Human-readable last sync time

### UI Indicators in AppShell (src/components/layout/AppShell.tsx)

**Sidebar sync status button:**
- Shows current sync status with icons
- Color-coded states:
  - Green: Synced
  - Blue: Syncing (spinning icon)
  - Yellow: Pending changes
  - Red: Sync error
  - Gray: Offline
- Displays last sync time
- Shows pending changes count
- Click to manually trigger sync

**Mobile header:**
- Offline indicator (WiFi off icon)
- Syncing indicator (spinning refresh icon)

### PWA Support

**Manifest (public/manifest.json):**
- App name and descriptions
- Display mode: standalone
- Theme color: #2563eb
- Orientation: portrait-primary
- Icon placeholders (192x192 and 512x512)

**Service Worker (public/service-worker.js):**
- Network-first strategy for dynamic content
- Cache-first for static assets
- Offline fallback to cached content
- Background sync support (for future)
- Message handling for app commands

**Registration (src/main.tsx):**
- Service worker registered on app load
- Auto-updates every minute

**HTML Updates (index.html):**
- Manifest link
- Apple mobile web app meta tags
- Theme color

### Auto-Sync Integration (src/App.tsx)

- Initial sync on login
- Auto-sync every 2 minutes
- Cleanup on logout

## Internationalization

Added translations for offline features in both English and Norwegian:

**English (src/i18n/locales/en/translation.json):**
- offline.status.online
- offline.status.offline
- offline.status.syncing
- offline.status.synced
- offline.status.error
- offline.pendingChanges
- offline.lastSync
- offline.syncNow

**Norwegian (src/i18n/locales/no/translation.json):**
- Corresponding Norwegian translations

## Usage

### For Coaches

1. **RSVPs:**
   - View RSVP summary on any event
   - Update player RSVPs from the event detail page
   - See pending responses at a glance

2. **Offline Mode:**
   - App works offline with cached data
   - Changes are queued locally
   - Automatic sync when back online
   - Manual sync via sidebar button
   - Clear sync status indicators

### For Developers

**To trigger manual sync:**
```typescript
import { performSync } from '@/services/sync.service';

const handleSync = async () => {
  const userId = user.id;
  const result = await performSync(userId);
  console.log('Sync result:', result);
};
```

**To check sync status:**
```typescript
import { useSyncStatus } from '@/hooks/useOffline';

const { synced, syncing, offline, pendingCount } = useSyncStatus();
```

**To work with offline database:**
```typescript
import { db } from '@/lib/offline-db';

// Query local data
const players = await db.players.toArray();
const teamPlayers = await db.players.where('team_id').equals(teamId).toArray();
```

## TODO / Future Enhancements

1. **Icons:**
   - Replace placeholder icons (icon-192.png, icon-512.png) with actual volleyball-themed icons
   - Use tools like realfavicongenerator.net or pwabuilder.com/imageGenerator

2. **Offline-First Pattern:**
   - Update service layers to use IndexedDB first, then Supabase
   - Implement optimistic UI updates
   - Add conflict resolution UI for merge conflicts

3. **Background Sync:**
   - Implement proper background sync API
   - Queue actions for retry on failure
   - Persist sync queue across app restarts

4. **Enhanced Error Handling:**
   - Better error messages for sync failures
   - Retry logic with exponential backoff
   - Conflict resolution UI

5. **Testing:**
   - Unit tests for sync logic
   - Integration tests for offline scenarios
   - E2E tests for PWA functionality

## Notes

- The sync service uses last-write-wins conflict resolution
- Only user-created data is synced (players, notes, etc.)
- System data (seasons, teams) is pulled but not pushed
- Service worker caches static assets only, not API responses
- IndexedDB is used for local storage (not localStorage)

## File Structure

```
src/
├── services/
│   ├── rsvp.service.ts          # RSVP operations
│   └── sync.service.ts          # Sync logic
├── lib/
│   └── offline-db.ts            # Dexie database
├── hooks/
│   └── useOffline.ts            # Offline hooks
├── components/
│   └── layout/
│       └── AppShell.tsx         # Updated with sync UI
├── pages/
│   └── EventDetailPage.tsx      # Updated with RSVP UI
└── i18n/
    └── locales/
        ├── en/
        │   └── translation.json # English translations
        └── no/
            └── translation.json # Norwegian translations

public/
├── manifest.json                # PWA manifest
├── service-worker.js            # Service worker
├── icon-192.png                 # App icon (placeholder)
└── icon-512.png                 # App icon (placeholder)
```

## Testing Checklist

- [ ] RSVP submission works for all statuses
- [ ] RSVP summary displays correct counts
- [ ] Coaches can update RSVPs for all players
- [ ] Offline mode works (disconnect network)
- [ ] Changes queue when offline
- [ ] Auto-sync works when back online
- [ ] Manual sync button works
- [ ] Sync status indicators update correctly
- [ ] PWA can be installed
- [ ] App works after installation
- [ ] Service worker caches correctly
- [ ] Offline fallback works

## Support

For questions or issues, refer to:
- Dexie.js docs: https://dexie.org/
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- PWA docs: https://web.dev/progressive-web-apps/
