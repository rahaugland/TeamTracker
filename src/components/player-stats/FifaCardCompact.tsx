import { cn } from '@/lib/utils';
import type { SubRatings } from '@/services/player-stats.service';
import type { VolleyballPosition } from '@/types/database.types';
import { getCardGradient, getPositionAbbr } from './fifaCardUtils';

interface FifaCardCompactProps {
  overallRating: number;
  subRatings: SubRatings;
  position: VolleyballPosition;
  playerName: string;
  photoUrl?: string;
  isProvisional?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  trendDelta?: number;
}

export function FifaCardCompact({
  overallRating,
  subRatings,
  position,
  playerName,
  photoUrl,
  isProvisional = false,
  trendDirection,
  trendDelta,
}: FifaCardCompactProps) {
  const gradientClass = getCardGradient(overallRating);

  return (
    <div className={cn('bg-gradient-to-r rounded-xl p-4', gradientClass)}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={playerName}
            className="w-14 h-14 rounded-full border-2 border-white/30 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl text-white/60 font-bold">
              {playerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Rating + Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white leading-none">{overallRating}</span>
            {isProvisional && (
              <span className="text-lg font-bold text-white/60">?</span>
            )}
            {trendDirection && trendDirection !== 'stable' && trendDelta !== undefined && (
              <span
                className={cn(
                  'text-xs font-bold px-1.5 py-0.5 rounded-full',
                  trendDirection === 'up'
                    ? 'bg-emerald-500/30 text-emerald-100'
                    : 'bg-club-primary/30 text-club-primary'
                )}
              >
                {trendDirection === 'up' ? '+' : ''}{Math.round(trendDelta)}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white truncate">{playerName}</p>
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">{getPositionAbbr(position)}</p>
        </div>

        {/* Mini stat badges */}
        <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
          <MiniStatBadge label="ATK" value={subRatings.attack} />
          <MiniStatBadge label="SRV" value={subRatings.serve} />
          <MiniStatBadge label="REC" value={subRatings.reception} />
          <MiniStatBadge label="CON" value={subRatings.consistency} />
        </div>
      </div>
    </div>
  );
}

function MiniStatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/20 rounded px-1.5 py-0.5 text-center min-w-[36px]">
      <div className="text-[8px] text-white/60 font-medium uppercase leading-tight">{label}</div>
      <div className="text-xs font-bold text-white leading-tight">{value}</div>
    </div>
  );
}
