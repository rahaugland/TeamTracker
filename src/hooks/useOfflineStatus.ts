import { useEffect, useState } from 'react';
import { logger } from '@/services/logger.service';

/**
 * Hook to track online/offline status
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Network status: Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Network status: Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
