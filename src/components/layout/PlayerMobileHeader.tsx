import { useSyncStatus } from '@/hooks/useOffline';
import { WifiOff, RefreshCw } from 'lucide-react';

export function PlayerMobileHeader() {
  const { offline, syncing } = useSyncStatus();

  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-navy-90">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-vq-teal to-vq-teal/70 flex items-center justify-center font-display font-black text-white text-xs">
          VQ
        </div>
        <span className="font-display font-extrabold text-sm uppercase tracking-wide text-white">
          VolleyQuest
        </span>
      </div>
      <div className="w-8 flex items-center justify-end">
        {offline && <WifiOff className="w-5 h-5 text-white/80" />}
        {!offline && syncing && <RefreshCw className="w-5 h-5 text-white animate-spin" />}
      </div>
    </div>
  );
}
