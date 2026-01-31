# Offline-First Pattern Implementation

This document explains how the offline-first pattern is implemented in TeamTracker using Dexie.js for players and team memberships.

## Overview

The offline-first pattern ensures that:
1. Users can interact with the app even when offline
2. All read operations are instant (from local IndexedDB)
3. All write operations are optimistic (write locally first, sync later)
4. Data syncs automatically when back online
5. Conflicts are resolved using last-write-wins strategy

## Architecture

```
User Action
    ↓
Local DB (Dexie/IndexedDB) ← Read operations return immediately
    ↓
Background Sync (if online)
    ↓
Supabase (PostgreSQL) ← Authoritative source
```

## Key Components

### 1. Offline Database (offline-db.ts)

Defines the local IndexedDB schema using Dexie.js with sync metadata:

- `_synced`: Boolean indicating if record is synced with Supabase
- `_lastModified`: Timestamp of last local modification
- `_deleted`: Soft delete flag for offline deletions

### 2. Players Service (players.service.ts)

All player operations now follow the offline-first pattern:

#### Read Operations

```typescript
// Example: getPlayers()
1. Read from local DB first (instant)
2. Return data immediately to UI
3. Background sync from Supabase (if online)
4. UI updates automatically when sync completes
```

#### Write Operations

```typescript
// Example: createPlayer()
1. Generate temporary ID for new records
2. Write to local DB immediately
3. Return optimistic result to UI
4. Sync to Supabase (if online)
5. Replace temp ID with real ID from Supabase
6. Mark as synced in local DB
```

### 3. Sync Service (sync.service.ts)

Handles bidirectional synchronization:

- **Push**: Sends unsynced local changes to Supabase
- **Pull**: Fetches remote changes to local DB
- **Conflict Resolution**: Last-write-wins based on updated_at timestamp

## Function Details

### getPlayers()

**Offline-First Behavior:**
- Always reads from local IndexedDB first
- Filters out soft-deleted records
- Triggers background sync if online
- Returns clean Player objects (sync metadata stripped)

**Fallback:**
- If local DB fails, falls back to direct Supabase query

### getPlayer(id)

**Offline-First Behavior:**
- Reads player and team memberships from local DB
- Joins team data locally
- Background syncs single player if online
- Fetches from Supabase if not found locally and online

### createPlayer(input)

**Offline-First Behavior:**
- Generates temporary ID: `temp_{timestamp}_{random}`
- Saves to local DB immediately with `_synced: false`
- Returns optimistic result instantly
- If online: Syncs to Supabase and updates local record with real ID
- If offline: Queued for sync when connection restored

### updatePlayer(id, input)

**Offline-First Behavior:**
- Updates local DB immediately
- Marks as unsynced
- Returns optimistic result
- If online: Syncs to Supabase immediately
- If offline: Queued for sync

### deletePlayer(id)

**Offline-First Behavior:**
- Soft deletes locally (sets `_deleted: true`)
- Marks as unsynced
- If online: Hard deletes from Supabase, then removes from local DB
- If offline: Queued for sync

## Team Membership Functions

All team membership functions follow the same offline-first pattern:

- `addPlayerToTeam()` - Create with temp ID
- `updateTeamMembership()` - Optimistic update
- `removePlayerFromTeam()` - Soft delete then sync
- `getTeamMembership()` - Read local first

## Sync Process

### Automatic Sync

The sync service provides auto-sync functionality:

```typescript
import { startAutoSync } from '@/services/sync.service';

// Start auto-sync every 60 seconds
startAutoSync(userId, 60000);
```

### Manual Sync

```typescript
import { performSync } from '@/services/sync.service';

const result = await performSync(userId);
console.log(`Pulled: ${result.pulled}, Pushed: ${result.pushed}`);
```

### Sync Status

```typescript
import { subscribeSyncStatus, getSyncStatus } from '@/services/sync.service';

// Subscribe to sync status changes
const unsubscribe = subscribeSyncStatus((status) => {
  console.log('Sync status:', status); // 'idle' | 'syncing' | 'error' | 'offline'
});

// Get current status
const currentStatus = getSyncStatus();
```

## Conflict Resolution

The implementation uses **last-write-wins** strategy:

1. When pulling from Supabase, compare `updated_at` timestamps
2. If local record is newer and unsynced, keep local version
3. Otherwise, use remote version
4. This ensures recent offline changes aren't overwritten

## Temporary IDs

For offline creation:

- Format: `temp_{timestamp}_{random}`
- Replaced with real UUID from Supabase when synced
- All foreign key references updated automatically

## Error Handling

The pattern gracefully handles errors:

1. **Local DB failure**: Falls back to direct Supabase query
2. **Network failure**: Keeps data in local queue for later sync
3. **Sync conflicts**: Resolved using last-write-wins
4. **Validation errors**: Logged and reported in sync results

## Database Schema Updates

The offline-db schema now includes:

```typescript
// Added compound index for efficient lookups
team_memberships: 'id, player_id, team_id, [player_id+team_id], ...'

// Added _deleted index for all tables
players: 'id, name, created_by, _synced, _lastModified, _deleted'
```

## Best Practices

### 1. Always Strip Sync Metadata

Before returning data to UI:

```typescript
function stripSyncMetadata(record: OfflinePlayer): Player {
  const { _synced, _lastModified, _deleted, ...cleanRecord } = record;
  return cleanRecord;
}
```

### 2. Handle Temporary IDs

Components should be prepared to receive temporary IDs and handle ID updates after sync.

### 3. Show Sync Status

Display sync status to users:

```typescript
const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

useEffect(() => {
  const unsubscribe = subscribeSyncStatus(setSyncStatus);
  return unsubscribe;
}, []);

// In UI:
{syncStatus === 'syncing' && <SyncingIndicator />}
{syncStatus === 'offline' && <OfflineWarning />}
```

### 4. Validate Before Sync

Ensure data integrity before syncing:

```typescript
// Validate required fields before creating
if (!input.name || !input.created_by) {
  throw new Error('Name and created_by are required');
}
```

### 5. Handle Stale Data

When displaying cached data, indicate freshness:

```typescript
const [lastSync, setLastSync] = useState<number | null>(null);

// Show "Last synced: 5 minutes ago"
```

## Testing Offline Behavior

### Simulate Offline Mode

In Chrome DevTools:
1. Open DevTools (F12)
2. Network tab > Throttling dropdown
3. Select "Offline"

### Test Scenarios

1. **Create while offline**: Should save locally and sync when online
2. **Update while offline**: Should update locally and sync later
3. **Delete while offline**: Should soft delete and hard delete on sync
4. **Conflict resolution**: Make changes offline on two devices, sync both

## Migration Path

To add offline-first to other entities:

1. Update `offline-db.ts` schema if needed
2. Import necessary functions from offline-db and sync service
3. Follow the pattern in `players.service.ts`:
   - Read from local DB first
   - Strip sync metadata before returning
   - Write to local DB optimistically
   - Sync to Supabase in background
4. Update `sync.service.ts` to handle the new entity
5. Test thoroughly with network offline

## Performance Considerations

### IndexedDB Performance

- IndexedDB operations are asynchronous but very fast
- Indexed queries (by id, player_id, team_id) are O(log n)
- Compound indexes enable efficient multi-field queries
- Bulk operations use `bulkPut` for better performance

### Memory Usage

- Only active data is kept in memory
- IndexedDB storage limit: ~50% of free disk space
- Soft-deleted records are periodically cleaned up

### Network Usage

- Background syncs are debounced
- Only unsynced records are pushed
- Pull operations use selective queries

## Troubleshooting

### Local DB out of sync

```typescript
import { clearAllData } from '@/lib/offline-db';
import { performSync } from '@/services/sync.service';

// Clear local DB and re-sync
await clearAllData();
await performSync(userId);
```

### Inspect Local Data

```typescript
// In browser console:
await db.players.toArray(); // See all local players
await db.players.where('_synced').equals(0).toArray(); // See unsynced
```

### Check Sync Status

```typescript
import { getSyncStatus } from '@/lib/offline-db';

const status = await getSyncStatus();
console.log(status);
// { totalRecords: 150, unsyncedRecords: 3, lastSync: 1706123456789 }
```

## Future Enhancements

Potential improvements to the offline-first pattern:

1. **Operational Transform**: Better conflict resolution for concurrent edits
2. **Selective Sync**: Only sync data relevant to current user
3. **Compression**: Compress large payloads for faster sync
4. **Background Sync API**: Use service workers for reliable background sync
5. **Delta Sync**: Only sync changed fields, not entire records
6. **Optimistic Locking**: Prevent lost updates with version numbers
