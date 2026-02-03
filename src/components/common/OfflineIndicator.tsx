import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/utils';

/**
 * Offline Indicator Component
 * Shows a banner when the app is offline
 */
export function OfflineIndicator() {
  const { t } = useTranslation();
  const { isOffline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-club-secondary text-white px-4 py-2',
        'flex items-center justify-center gap-2 text-sm font-medium',
        'animate-in slide-in-from-top-full'
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>{t('offline.status.offline')}</span>
    </div>
  );
}
