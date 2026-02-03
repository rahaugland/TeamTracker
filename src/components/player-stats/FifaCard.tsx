import { Card } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { SubRatings } from '@/services/player-stats.service';
import type { VolleyballPosition } from '@/types/database.types';

interface FifaCardProps {
  overallRating: number;
  subRatings: SubRatings;
  position: VolleyballPosition;
  playerName: string;
  photoUrl?: string;
  gamesPlayed: number;
  formRating?: number;
  formPractices?: { attended: number; total: number };
  isProvisional?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  trendDelta?: number;
}

/**
 * Get card gradient classes based on overall rating
 */
function getCardGradient(rating: number): string {
  if (rating >= 90) return 'from-yellow-400 via-amber-500 to-yellow-600'; // Gold
  if (rating >= 80) return 'from-purple-500 via-indigo-600 to-purple-700'; // Purple
  if (rating >= 70) return 'from-blue-500 via-cyan-600 to-blue-700'; // Blue
  if (rating >= 60) return 'from-green-500 via-emerald-600 to-green-700'; // Green
  if (rating >= 50) return 'from-gray-400 via-slate-500 to-gray-600'; // Gray
  return 'from-amber-700 via-orange-800 to-amber-900'; // Bronze
}

/**
 * Get position abbreviation for display
 */
function getPositionAbbr(position: VolleyballPosition): string {
  const abbr: Record<VolleyballPosition, string> = {
    setter: 'SET',
    outside_hitter: 'OH',
    middle_blocker: 'MB',
    opposite: 'OPP',
    libero: 'LIB',
    defensive_specialist: 'DS',
    all_around: 'ALL',
  };
  return abbr[position];
}

/**
 * Get position full name
 */
function getPositionName(position: VolleyballPosition): string {
  const names: Record<VolleyballPosition, string> = {
    setter: 'Setter',
    outside_hitter: 'Outside Hitter',
    middle_blocker: 'Middle Blocker',
    opposite: 'Opposite',
    libero: 'Libero',
    defensive_specialist: 'Defensive Specialist',
    all_around: 'All Around',
  };
  return names[position];
}

/**
 * FIFA Ultimate Team style player card
 */
export function FifaCard({
  overallRating,
  subRatings,
  position,
  playerName,
  photoUrl,
  gamesPlayed,
  formRating,
  formPractices,
  isProvisional = false,
  trendDirection,
  trendDelta,
}: FifaCardProps) {
  const gradientClass = getCardGradient(overallRating);
  const positionAbbr = getPositionAbbr(position);
  const positionName = getPositionName(position);

  // Prepare data for radar chart (4 axes)
  const radarData = [
    { stat: 'ATK', value: subRatings.attack },
    { stat: 'SRV', value: subRatings.serve },
    { stat: 'REC', value: subRatings.reception },
    { stat: 'CON', value: subRatings.consistency },
  ];

  return (
    <Card className="overflow-hidden relative w-full max-w-md">
      {/* Gradient background */}
      <div className={cn('bg-gradient-to-br', gradientClass, 'p-6')}>
        {/* Top section: Overall rating and position */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-white">
            <div className="flex items-center gap-2">
              <div className="text-5xl font-bold leading-none">{overallRating}</div>
              {isProvisional && (
                <div className="text-2xl font-bold leading-none opacity-70" title="Provisional - fewer than 3 games">?</div>
              )}
              {trendDirection && trendDirection !== 'stable' && trendDelta !== undefined && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-sm font-bold',
                    trendDirection === 'up'
                      ? 'bg-emerald-500/30 text-emerald-100'
                      : 'bg-club-primary/30 text-club-primary'
                  )}
                >
                  <span>{trendDirection === 'up' ? '↑' : '↓'}</span>
                  <span>{trendDirection === 'up' ? '+' : ''}{Math.round(trendDelta)}</span>
                </div>
              )}
            </div>
            <div className="text-sm font-semibold mt-1 uppercase tracking-wide">{positionAbbr}</div>
          </div>
          <div className="text-right text-white space-y-1">
            <div className="text-xs opacity-90 uppercase tracking-wider">Rating</div>
            <div className="text-xs opacity-75">{gamesPlayed} Games</div>
            {isProvisional && (
              <div className="text-xs opacity-75 mt-1">Provisional</div>
            )}
            {formRating !== undefined && formPractices && (
              <div className="mt-2">
                <div className="text-xs opacity-90 uppercase tracking-wider">Form</div>
                <div className="text-2xl font-bold leading-none">{formRating}</div>
                <div className="text-xs opacity-75">{formPractices.attended}/{formPractices.total} practices</div>
              </div>
            )}
          </div>
        </div>

        {/* Player name */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white leading-tight">{playerName}</h2>
          <p className="text-sm text-white/80 mt-0.5">{positionName}</p>
        </div>

        {/* Player photo placeholder */}
        <div className="mb-4 flex justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={playerName}
              className="w-32 h-32 rounded-full border-4 border-white/30 object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center">
              <span className="text-5xl text-white/60 font-bold">
                {playerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Sub-stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBadge label="ATK" value={subRatings.attack} />
          <StatBadge label="SRV" value={subRatings.serve} />
          <StatBadge label="REC" value={subRatings.reception} />
          <StatBadge label="CON" value={subRatings.consistency} />
        </div>

        {/* Radar chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
              <PolarAngleAxis
                dataKey="stat"
                tick={{ fill: 'white', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 99]} tick={false} />
              <Radar
                name="Stats"
                dataKey="value"
                stroke="rgba(255, 255, 255, 0.8)"
                fill="rgba(255, 255, 255, 0.3)"
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

/**
 * Individual stat badge component
 */
function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1.5 text-center">
      <div className="text-xs text-white/70 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-white leading-tight">{value}</div>
    </div>
  );
}
