/**
 * Example: Using Offline-First Players Service
 *
 * This file demonstrates how to use the updated players service
 * with offline-first capabilities in React components.
 */

import { useState, useEffect } from 'react';
import {
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  type Player,
} from '@/services/players.service';
import {
  subscribeSyncStatus,
  performSync,
  type SyncStatus,
} from '@/services/sync.service';

/**
 * Example 1: Display Players List with Sync Status
 */
export function PlayersListComponent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = subscribeSyncStatus(setSyncStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      // This reads from local DB first (instant), then syncs in background
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Sync Status Indicator */}
      <div className="sync-status">
        {syncStatus === 'syncing' && <span>🔄 Syncing...</span>}
        {syncStatus === 'offline' && <span>⚠️ Offline Mode</span>}
        {syncStatus === 'error' && <span>❌ Sync Error</span>}
        {syncStatus === 'idle' && <span>✅ Up to date</span>}
      </div>

      {/* Players List */}
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name}
            {/* Indicate if this is a temp ID (offline creation) */}
            {player.id.startsWith('temp_') && (
              <span className="badge">Pending Sync</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 2: Create Player Form (Works Offline)
 */
export function CreatePlayerForm({ userId }: { userId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    try {
      // This saves to local DB immediately and returns instantly
      // Then syncs to Supabase in the background
      const newPlayer = await createPlayer({
        name,
        email,
        created_by: userId,
      });

      // Show success immediately (optimistic)
      if (newPlayer.id.startsWith('temp_')) {
        setSuccessMessage('Player created! Will sync when online.');
      } else {
        setSuccessMessage('Player created and synced!');
      }

      // Reset form
      setName('');
      setEmail('');
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Failed to create player');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Create Player'}
      </button>
      {successMessage && <div className="success">{successMessage}</div>}
    </form>
  );
}

/**
 * Example 3: Edit Player Form (Optimistic Updates)
 */
export function EditPlayerForm({ playerId }: { playerId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      // This updates local DB immediately and returns instantly
      // UI updates optimistically before server confirms
      await updatePlayer(playerId, {
        name,
        email,
      });

      alert('Player updated! Changes syncing in background.');
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

/**
 * Example 4: Delete Player (With Confirmation)
 */
export function DeletePlayerButton({ playerId }: { playerId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    setIsDeleting(true);

    try {
      // This soft-deletes locally immediately
      // Then hard-deletes from Supabase in background
      await deletePlayer(playerId);
      alert('Player deleted!');
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete Player'}
    </button>
  );
}

/**
 * Example 5: Manual Sync Button
 */
export function SyncButton({ userId }: { userId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');

  async function handleSync() {
    setIsSyncing(true);
    setSyncResult('');

    try {
      const result = await performSync(userId);

      if (result.success) {
        setSyncResult(
          `Synced! Pulled ${result.pulled} records, Pushed ${result.pushed} records`
        );
      } else {
        setSyncResult(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncResult('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div>
      <button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? '🔄 Syncing...' : '🔄 Sync Now'}
      </button>
      {syncResult && <div className="sync-result">{syncResult}</div>}
    </div>
  );
}

/**
 * Example 6: Offline Indicator with Auto-Sync
 */
export function OfflineIndicator({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    // Listen for online/offline events
    function handleOnline() {
      setIsOnline(true);
      // Trigger sync when coming back online
      performSync(userId).catch(console.error);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  useEffect(() => {
    // Check for unsynced records
    async function checkUnsyncedCount() {
      const { getSyncStatus } = await import('@/lib/offline-db');
      const status = await getSyncStatus();
      setUnsyncedCount(status.unsyncedRecords);
    }

    checkUnsyncedCount();
    const interval = setInterval(checkUnsyncedCount, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isOnline && unsyncedCount === 0) {
    return null; // Everything is good
  }

  return (
    <div className="offline-indicator">
      {!isOnline && (
        <div className="warning">
          ⚠️ You are offline. Changes will sync when connection is restored.
        </div>
      )}
      {unsyncedCount > 0 && (
        <div className="info">
          📤 {unsyncedCount} change{unsyncedCount !== 1 ? 's' : ''} pending sync
        </div>
      )}
    </div>
  );
}

/**
 * Example 7: Search Players (Works Offline)
 */
export function PlayerSearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        // This searches local DB first, so it works offline
        const { searchPlayers } = await import('@/services/players.service');
        const data = await searchPlayers(query);
        setResults(data);
      } catch (error) {
        console.error('Error searching players:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search players..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isSearching && <div>Searching...</div>}
      <ul>
        {results.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 8: Complete Player Management Component
 */
export function PlayerManagement({ userId }: { userId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load players on mount
    loadPlayers();

    // Subscribe to sync status
    const unsubscribeSyncStatus = subscribeSyncStatus(setSyncStatus);

    // Listen for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      performSync(userId).then(() => loadPlayers());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeSyncStatus();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  async function loadPlayers() {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  }

  async function handleCreatePlayer(name: string, email: string) {
    try {
      await createPlayer({ name, email, created_by: userId });
      // Reload to show new player
      loadPlayers();
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  async function handleDeletePlayer(playerId: string) {
    try {
      await deletePlayer(playerId);
      // Optimistically remove from UI
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (error) {
      console.error('Error deleting player:', error);
      // Reload on error to restore UI
      loadPlayers();
      throw error;
    }
  }

  return (
    <div className="player-management">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="connection-status">
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
        <div className="sync-status">
          {syncStatus === 'syncing' && '🔄 Syncing...'}
          {syncStatus === 'idle' && '✅ Synced'}
          {syncStatus === 'error' && '❌ Sync Error'}
        </div>
      </div>

      {/* Players List */}
      <div className="players-list">
        {players.map((player) => (
          <div key={player.id} className="player-item">
            <span>{player.name}</span>
            {player.id.startsWith('temp_') && (
              <span className="badge">Pending</span>
            )}
            <button onClick={() => handleDeletePlayer(player.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <CreatePlayerForm userId={userId} />

      {/* Manual Sync */}
      <SyncButton userId={userId} />
    </div>
  );
}
