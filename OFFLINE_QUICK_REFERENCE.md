# Offline-First Quick Reference

Quick reference guide for using offline-first players service in TeamTracker.

## Import What You Need

```typescript
// Player operations
import {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getPlayersByTeam,
  searchPlayers,
  addPlayerToTeam,
  updateTeamMembership,
  removePlayerFromTeam,
} from '@/services/players.service';

// Sync operations
import {
  performSync,
  subscribeSyncStatus,
  getSyncStatus,
  isOnline,
} from '@/services/sync.service';

// Database utilities (rarely needed)
import { db, clearAllData, getSyncStatus } from '@/lib/offline-db';
```

## Common Patterns

### 1. Load Players

```typescript
// Simply call - works online and offline
const players = await getPlayers();
// Returns instantly from local DB
// Syncs in background if online
```

### 2. Create Player

```typescript
const newPlayer = await createPlayer({
  name: 'John Doe',
  email: 'john@example.com',
  created_by: userId,
});

// Check if pending sync
if (newPlayer.id.startsWith('temp_')) {
  console.log('Queued for sync');
} else {
  console.log('Synced to server');
}
```

### 3. Update Player

```typescript
const updated = await updatePlayer(playerId, {
  name: 'Jane Doe',
  email: 'jane@example.com',
});
// UI updates instantly
// Syncs to server in background
```

### 4. Delete Player

```typescript
await deletePlayer(playerId);
// Removed from UI instantly
// Syncs to server in background
```

### 5. Show Sync Status

```typescript
const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

useEffect(() => {
  const unsubscribe = subscribeSyncStatus(setSyncStatus);
  return unsubscribe;
}, []);

// In render:
{syncStatus === 'syncing' && <Spinner />}
{syncStatus === 'offline' && <OfflineBadge />}
```

### 6. Manual Sync

```typescript
const result = await performSync(userId);
console.log(`Synced: ${result.pulled} pulled, ${result.pushed} pushed`);
```

### 7. Check Online Status

```typescript
import { isOnline } from '@/services/sync.service';

if (!isOnline()) {
  alert('You are offline. Changes will sync later.');
}
```

### 8. Handle Network Changes

```typescript
useEffect(() => {
  const handleOnline = () => {
    performSync(userId); // Auto-sync when back online
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [userId]);
```

## Component Checklist

When building components with offline support:

- [ ] Load data immediately (no loading state needed)
- [ ] Handle temporary IDs (check `id.startsWith('temp_')`)
- [ ] Show sync status indicator
- [ ] Show offline warning when disconnected
- [ ] Update UI optimistically (don't wait for server)
- [ ] Handle sync errors gracefully
- [ ] Auto-sync on reconnection

## Sync Status Values

```typescript
type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// idle - Everything synced, no activity
// syncing - Currently syncing with server
// error - Last sync failed
// offline - Device is offline
```

## Temporary IDs

Offline-created records get temporary IDs:

```typescript
// Format
const tempId = `temp_${timestamp}_${random}`;

// Example
"temp_1706123456789_a7b3c2d9"

// Check if temporary
const isPending = player.id.startsWith('temp_');

// IDs are replaced with real UUIDs after sync
```

## Error Handling

```typescript
try {
  await createPlayer(input);
} catch (error) {
  // Only fails if local DB fails
  // Network errors are handled gracefully
  console.error('Failed to save locally:', error);
  alert('Failed to create player');
}
```

## Best Practices

### DO ✅

- Use functions normally - they handle online/offline automatically
- Show sync status to users
- Indicate pending changes (temp IDs)
- Update UI optimistically
- Handle reconnection events
- Trust the offline-first pattern

### DON'T ❌

- Wait for network before updating UI
- Show loading spinners for local operations
- Manually check if online before every operation
- Try to handle sync yourself
- Assume IDs are permanent immediately

## Performance Tips

### Fast Operations (Instant)
- `getPlayers()` - reads from local DB
- `getPlayer(id)` - reads from local DB
- `createPlayer()` - writes to local DB
- `updatePlayer()` - writes to local DB
- `deletePlayer()` - writes to local DB
- `searchPlayers()` - searches local DB

### Background Operations (Non-blocking)
- Sync to Supabase
- Background sync on read
- Auto-sync on network change

## Debugging

### Check Local Data

```typescript
// In browser console
await db.players.toArray(); // All local players
await db.players.where('_synced').equals(0).toArray(); // Unsynced only
```

### Check Sync Status

```typescript
import { getSyncStatus } from '@/lib/offline-db';
const status = await getSyncStatus();
console.log(status);
// { totalRecords: 150, unsyncedRecords: 3, lastSync: 1706123456789 }
```

### Clear Local Data

```typescript
import { clearAllData } from '@/lib/offline-db';
await clearAllData(); // Nuclear option - clears everything
await performSync(userId); // Re-sync from server
```

### Force Sync

```typescript
import { performSync } from '@/services/sync.service';
const result = await performSync(userId);
if (!result.success) {
  console.error('Sync errors:', result.errors);
}
```

## TypeScript Types

```typescript
import type { Player } from '@/types/database.types';
import type { SyncStatus, SyncResult } from '@/services/sync.service';

// Player has these fields
interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  positions: VolleyballPosition[];
  photo_url?: string;
  user_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Note: Sync metadata (_synced, _lastModified, _deleted) is stripped
// You never see these fields in your components
```

## Common Scenarios

### Scenario 1: User Creates Player Offline

1. User fills out form, clicks "Create"
2. `createPlayer()` saves to local DB with temp ID
3. UI shows player immediately
4. Badge shows "Pending Sync"
5. When online, sync runs automatically
6. Temp ID replaced with real ID
7. Badge disappears

### Scenario 2: User Updates Player, Then Goes Offline

1. User edits player, clicks "Save"
2. `updatePlayer()` saves to local DB
3. UI updates immediately
4. Sync to server succeeds
5. User goes offline
6. User edits same player again
7. `updatePlayer()` saves to local DB
8. UI updates immediately
9. Marked as unsynced
10. When online, sync runs
11. Latest version syncs to server

### Scenario 3: Two Devices, Same User

1. Device A: Update player (offline)
2. Device B: Update same player (offline)
3. Device A: Comes online, syncs (timestamp T1)
4. Device B: Comes online, syncs (timestamp T2)
5. Last-write-wins: T2 > T1, so Device B's changes win
6. Device A: Next sync pulls Device B's changes

## Testing Offline Behavior

### Chrome DevTools

1. Open DevTools (F12)
2. Network tab
3. Throttling dropdown
4. Select "Offline"

### Test Cases

```typescript
// Test 1: Create offline
// - Set offline mode
// - Create player
// - Check ID starts with 'temp_'
// - Go online
// - Wait for sync
// - Check ID is now UUID

// Test 2: Update offline
// - Load player
// - Set offline mode
// - Update player
// - Check UI updates
// - Go online
// - Verify sync

// Test 3: Delete offline
// - Set offline mode
// - Delete player
// - Check removed from UI
// - Go online
// - Verify deleted from server
```

## Migration Checklist

Migrating old code to offline-first:

- [ ] Remove manual online checks before operations
- [ ] Remove loading states for local operations
- [ ] Add sync status indicator
- [ ] Add offline indicator
- [ ] Add auto-sync on reconnection
- [ ] Handle temporary IDs in UI
- [ ] Test offline scenarios
- [ ] Update error handling

## Support

For questions or issues:

1. Check `OFFLINE_FIRST_PATTERN.md` for detailed docs
2. Check `examples/offline-first-usage.tsx` for examples
3. Check browser console for sync errors
4. Use debugging commands above
5. Check network tab in DevTools

## Quick Troubleshooting

**Problem**: Changes not syncing
- Check: Is device online? `isOnline()`
- Check: Any sync errors? `getSyncStatus()`
- Try: Manual sync `performSync(userId)`

**Problem**: Old data showing
- Check: When was last sync? `getLastSyncTime()`
- Try: Manual sync to pull fresh data

**Problem**: Duplicate players
- Check: Temp IDs not being replaced?
- Fix: Clear local data and re-sync

**Problem**: App feels slow
- Check: Is it reading from Supabase directly?
- Verify: Should read from local DB first
- Check: Network tab shows no requests on read

**Problem**: Lost changes
- Check: Was sync successful? Check errors
- Verify: Conflict resolution (last-write-wins)
- Review: Sync status before going offline
