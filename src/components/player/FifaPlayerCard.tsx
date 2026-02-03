import { cn } from '@/lib/utils';

/**
 * Volleyball skill types for the FIFA-style card
 */
export type VolleyballSkill =
  | 'serve'
  | 'receive'
  | 'set'
  | 'block'
  | 'attack'
  | 'dig'
  | 'mental'
  | 'physique';

/**
 * Skill rating with trend indicator
 */
export interface SkillRating {
  type: VolleyballSkill;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  label: string;
  abbr: string;
}

/**
 * Player tier/rating level
 */
export type PlayerTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'elite';

/**
 * Props for the FifaPlayerCard component
 */
export interface FifaPlayerCardProps {
  /** Player's full name */
  playerName: string;
  /** Player's initials for avatar */
  initials: string;
  /** Overall rating (0-99) */
  overallRating: number;
  /** Player position abbreviation (e.g., "OH", "MB", "S") */
  position: string;
  /** Player tier */
  tier?: PlayerTier;
  /** Club/team name */
  clubName: string;
  /** Overall rating change indicator */
  ratingChange?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  /** Array of 8 skill ratings */
  skills: SkillRating[];
  /** Optional className for styling */
  className?: string;
  /** Optional custom avatar image URL */
  avatarUrl?: string;
}

/**
 * Skill abbreviation mapping
 */
const SKILL_ABBR_MAP: Record<VolleyballSkill, string> = {
  serve: 'SRV',
  receive: 'RCV',
  set: 'SET',
  block: 'BLK',
  attack: 'ATK',
  dig: 'DIG',
  mental: 'MNT',
  physique: 'PHY',
};

/**
 * Get tier display label
 */
const getTierLabel = (tier: PlayerTier): string => {
  return tier.toUpperCase();
};

/**
 * FifaPlayerCard Component
 *
 * A FIFA-style player card displaying player rating, position, and skill attributes.
 * Inspired by classic FIFA Ultimate Team card design with volleyball-specific adaptations.
 *
 * @example
 * ```tsx
 * <FifaPlayerCard
 *   playerName="Erik Hansen"
 *   initials="EH"
 *   overallRating={78}
 *   position="OH"
 *   tier="gold"
 *   clubName="Oslo Volley U19"
 *   ratingChange={{ value: 3, direction: 'up' }}
 *   skills={[
 *     { type: 'serve', value: 76, trend: 'up', label: 'Serve', abbr: 'SRV' },
 *     { type: 'receive', value: 72, trend: 'down', label: 'Receive', abbr: 'RCV' },
 *     // ... 6 more skills
 *   ]}
 * />
 * ```
 */
export function FifaPlayerCard({
  playerName,
  initials,
  overallRating,
  position,
  tier = 'gold',
  clubName,
  ratingChange,
  skills,
  className,
  avatarUrl,
}: FifaPlayerCardProps) {
  return (
    <div
      className={cn(
        'w-[280px] min-h-[420px] rounded-lg relative overflow-hidden p-6 flex flex-col',
        'bg-gradient-to-br from-[#2a1f0a] via-[#1a1508] to-[#2a1a05]',
        'border border-[rgba(255,183,3,0.35)]',
        'shadow-[0_8px_32px_rgba(255,183,3,0.15),inset_0_1px_0_rgba(255,183,3,0.1)]',
        className
      )}
    >
      {/* Decorative glow effect */}
      <div
        className="absolute -top-1/2 -right-[30%] w-[200px] h-[200px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 183, 3, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Top row: Rating block + Trend badge */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        {/* Rating block */}
        <div className="flex flex-col">
          <div className="font-display font-extrabold text-[9px] tracking-[3px] uppercase text-club-secondary mb-0.5">
            {getTierLabel(tier)}
          </div>
          <div
            className="font-display font-black text-[52px] leading-none bg-gradient-to-br from-club-secondary to-[#FFD166] bg-clip-text text-transparent"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {overallRating}
          </div>
          <div className="font-display font-bold text-[13px] text-[rgba(255,183,3,0.6)] tracking-[2px]">
            {position}
          </div>
        </div>

        {/* Trend badge */}
        {ratingChange && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md font-mono font-bold text-[11px]',
              ratingChange.direction === 'up' &&
                'bg-[rgba(34,197,94,0.2)] text-[#22C55E]',
              ratingChange.direction === 'down' &&
                'bg-[rgba(239,68,68,0.2)] text-[#EF4444]',
              ratingChange.direction === 'stable' &&
                'bg-[rgba(255,255,255,0.1)] text-[#8B95A5]'
            )}
          >
            <span className="text-sm leading-none">
              {ratingChange.direction === 'up' && '↑'}
              {ratingChange.direction === 'down' && '↓'}
              {ratingChange.direction === 'stable' && '—'}
            </span>
            <span>
              {ratingChange.direction === 'stable'
                ? '0'
                : `${ratingChange.value > 0 ? '+' : ''}${ratingChange.value}`}
            </span>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="w-20 h-20 rounded-lg bg-[rgba(255,183,3,0.1)] border-2 border-[rgba(255,183,3,0.3)] mx-auto my-4 flex items-center justify-center relative z-10">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={playerName}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="font-display font-black text-[28px] text-club-secondary">
            {initials}
          </span>
        )}
      </div>

      {/* Player name */}
      <div className="font-display font-extrabold text-base uppercase text-center tracking-wider leading-none relative z-10">
        {playerName}
      </div>

      {/* Club name */}
      <div className="text-[10px] text-[#8B95A5] text-center mt-0.5 mb-4 relative z-10">
        {clubName}
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-2 gap-1.5 mt-auto pt-4 border-t border-[rgba(255,183,3,0.15)] relative z-10">
        {skills.map((skill) => (
          <div
            key={skill.type}
            className="flex items-center justify-between px-2 py-1 bg-[rgba(0,0,0,0.2)] rounded-md"
          >
            <span className="font-mono font-bold text-base text-club-secondary min-w-[28px]">
              {skill.value}
              {skill.trend && (
                <span
                  className={cn(
                    'text-[10px] ml-0.5',
                    skill.trend === 'up' && 'text-[#22C55E]',
                    skill.trend === 'down' && 'text-[#EF4444]'
                  )}
                >
                  {skill.trend === 'up' && '↑'}
                  {skill.trend === 'down' && '↓'}
                </span>
              )}
            </span>
            <span className="font-display font-semibold text-[9px] tracking-wider uppercase text-[rgba(255,255,255,0.6)]">
              {skill.abbr || SKILL_ABBR_MAP[skill.type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to create default skills array
 */
export function createDefaultSkills(ratings: Partial<Record<VolleyballSkill, number>>): SkillRating[] {
  const skillLabels: Record<VolleyballSkill, string> = {
    serve: 'Serve',
    receive: 'Receive',
    set: 'Set',
    block: 'Block',
    attack: 'Attack',
    dig: 'Dig',
    mental: 'Mental',
    physique: 'Physique',
  };

  const defaultOrder: VolleyballSkill[] = [
    'serve',
    'receive',
    'set',
    'block',
    'attack',
    'dig',
    'mental',
    'physique',
  ];

  return defaultOrder.map((type) => ({
    type,
    value: ratings[type] ?? 50,
    label: skillLabels[type],
    abbr: SKILL_ABBR_MAP[type],
  }));
}
