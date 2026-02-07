import { useEffect, useState } from 'react';
import { getSyncStatus, subscribeSyncStatus, getLastSyncTime } from '@/services/sync.service';
import type { SyncStatus } from '@/services/sync.service';
import { getSyncStatus as getDbSyncStatus } from '@/lib/offline-db';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to get sync status and pending changes count
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [lastSync, setLastSync] = useState<number | null>(getLastSyncTime());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = subscribeSyncStatus((status) => {
      setSyncStatus(status);
      setLastSync(getLastSyncTime());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update pending count periodically
    const updatePendingCount = async () => {
      const dbStatus = await getDbSyncStatus();
      setPendingCount(dbStatus.unsyncedRecords);
    };

    updatePendingCount();

    // Update every 5 seconds while syncing or offline
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, [syncStatus, isOnline]);

  return {
    synced: syncStatus === 'idle' && pendingCount === 0,
    syncing: syncStatus === 'syncing',
    error: syncStatus === 'error',
    offline: !isOnline,
    pendingCount,
    lastSync,
  };
}

/**
 * Hook to format last sync time
 */
export function useLastSyncFormatted(): string | null {
  const { lastSync } = useSyncStatus();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!lastSync) return;
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [lastSync]);

  // Suppress unused var warning - tick triggers re-renders for time updates
  void tick;

  if (!lastSync) return null;

  const diff = Date.now() - lastSync;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / 86400000);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}
