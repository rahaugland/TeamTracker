import { FifaPlayerCard, createDefaultSkills, type PlayerTier, type SkillRating, type VolleyballSkill } from './FifaPlayerCard';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { PlayerRating } from '@/services/player-stats.service';

/**
 * Integration example: Using FifaPlayerCard in a player detail page
 *
 * This example shows how to integrate the FIFA-style card with real player data
 * from your application's database.
 */

/**
 * Helper function to determine player tier based on overall rating
 */
function calculatePlayerTier(rating: number): PlayerTier {
  if (rating >= 90) return 'elite';
  if (rating >= 80) return 'diamond';
  if (rating >= 70) return 'gold';
  if (rating >= 60) return 'silver';
  return 'bronze';
}

/**
 * Helper function to calculate rating change from previous period
 */
function calculateRatingChange(
  currentRating: number,
  previousRating?: number
): { value: number; direction: 'up' | 'down' | 'stable' } | undefined {
  if (!previousRating) return undefined;

  const change = currentRating - previousRating;

  if (change > 0) {
    return { value: change, direction: 'up' };
  } else if (change < 0) {
    return { value: change, direction: 'down' };
  } else {
    return { value: 0, direction: 'stable' };
  }
}

/**
 * Convert PlayerRating from service to SkillRating array for the card.
 * SubRatings now has all 8 skills directly computed.
 */
function mapPlayerRatingToSkills(
  playerRating: PlayerRating,
  previousRating?: PlayerRating
): SkillRating[] {
  const current = playerRating.subRatings;
  const previous = previousRating?.subRatings;

  const skillDefs: Array<{ type: VolleyballSkill; key: keyof typeof current; label: string; abbr: string }> = [
    { type: 'serve',    key: 'serve',    label: 'Serve',    abbr: 'SRV' },
    { type: 'receive',  key: 'receive',  label: 'Receive',  abbr: 'RCV' },
    { type: 'set',      key: 'set',      label: 'Set',      abbr: 'SET' },
    { type: 'block',    key: 'block',    label: 'Block',    abbr: 'BLK' },
    { type: 'attack',   key: 'attack',   label: 'Attack',   abbr: 'ATK' },
    { type: 'dig',      key: 'dig',      label: 'Dig',      abbr: 'DIG' },
    { type: 'mental',   key: 'mental',   label: 'Mental',   abbr: 'MNT' },
    { type: 'physique', key: 'physique', label: 'Physique', abbr: 'PHY' },
  ];

  return skillDefs.map(({ type, key, label, abbr }) => ({
    type,
    value: current[key],
    trend: previous
      ? current[key] > previous[key]
        ? ('up' as const)
        : current[key] < previous[key]
        ? ('down' as const)
        : undefined
      : undefined,
    label,
    abbr,
  }));
}

/**
 * Get player initials from name
 */
function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Props for the integration example component
 */
interface PlayerFifaCardIntegrationProps {
  player: PlayerWithMemberships;
  playerRating: PlayerRating;
  previousRating?: PlayerRating;
  teamName?: string;
  className?: string;
}

/**
 * PlayerFifaCardIntegration
 *
 * Example component showing how to integrate FifaPlayerCard with real data
 */
export function PlayerFifaCardIntegration({
  player,
  playerRating,
  previousRating,
  teamName,
  className,
}: PlayerFifaCardIntegrationProps) {
  // Calculate derived values
  const overallRating = playerRating.overall;
  const tier = calculatePlayerTier(overallRating);
  const ratingChange = calculateRatingChange(
    overallRating,
    previousRating?.overall
  );
  const skills = mapPlayerRatingToSkills(playerRating, previousRating);
  const initials = getPlayerInitials(player.name);
  const fullName = player.name;

  // Get primary position abbreviation
  const position = player.positions[0]?.toUpperCase().substring(0, 3) || 'ALL';

  return (
    <FifaPlayerCard
      playerName={fullName}
      initials={initials}
      overallRating={overallRating}
      position={position}
      tier={tier}
      clubName={teamName || 'Volleyball Club'}
      ratingChange={ratingChange}
      skills={skills}
      className={className}
    />
  );
}

/**
 * Example usage in a player detail page:
 *
 * ```tsx
 * import { PlayerFifaCardIntegration } from '@/components/player/FifaPlayerCard.example';
 *
 * export function PlayerDetailPage() {
 *   const { id } = useParams();
 *   const [player, setPlayer] = useState<PlayerWithMemberships | null>(null);
 *   const [currentRating, setCurrentRating] = useState<PlayerRating | null>(null);
 *   const [previousRating, setPreviousRating] = useState<PlayerRating | null>(null);
 *
 *   // ... load player data ...
 *
 *   return (
 *     <div className="container mx-auto p-6">
 *       <div className="flex gap-8">
 *         {player && currentRating && (
 *           <PlayerFifaCardIntegration
 *             player={player}
 *             playerRating={currentRating}
 *             previousRating={previousRating}
 *             teamName="Oslo Volley U19"
 *           />
 *         )}
 *
 *         <div className="flex-1">
 *           {/* Rest of player detail content *\/}
 *         </div>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Example: Quick card for roster view with minimal data
 */
interface QuickPlayerCardProps {
  playerName: string;
  position: string;
  overallRating: number;
  jerseyNumber?: number;
}

export function QuickPlayerCard({
  playerName,
  position,
  overallRating,
  jerseyNumber,
}: QuickPlayerCardProps) {
  const initials = getPlayerInitials(playerName);

  // Use default skills when detailed stats aren't available
  const skills = createDefaultSkills({
    serve: overallRating - 5,
    receive: overallRating - 3,
    attack: overallRating + 2,
    block: overallRating - 2,
    set: overallRating - 8,
    dig: overallRating - 4,
    mental: overallRating,
    physique: overallRating - 1,
  });

  return (
    <FifaPlayerCard
      playerName={playerName}
      initials={jerseyNumber ? `#${jerseyNumber}` : initials}
      overallRating={overallRating}
      position={position}
      tier={calculatePlayerTier(overallRating)}
      clubName="Team"
      skills={skills}
      className="scale-90"
    />
  );
}

/**
 * Example: Player comparison view
 */
interface PlayerComparisonProps {
  player1: {
    name: string;
    rating: number;
    position: string;
    teamName: string;
    skills: SkillRating[];
  };
  player2: {
    name: string;
    rating: number;
    position: string;
    teamName: string;
    skills: SkillRating[];
  };
}

export function PlayerComparison({ player1, player2 }: PlayerComparisonProps) {
  return (
    <div className="flex gap-8 items-start justify-center p-8 bg-navy">
      <div className="flex flex-col items-center">
        <FifaPlayerCard
          playerName={player1.name}
          initials={player1.name.split(' ').map(n => n[0]).join('')}
          overallRating={player1.rating}
          position={player1.position}
          tier={calculatePlayerTier(player1.rating)}
          clubName={player1.teamName}
          skills={player1.skills}
        />
      </div>

      <div className="flex items-center justify-center pt-48">
        <div className="text-6xl font-display font-black text-club-secondary">
          VS
        </div>
      </div>

      <div className="flex flex-col items-center">
        <FifaPlayerCard
          playerName={player2.name}
          initials={player2.name.split(' ').map(n => n[0]).join('')}
          overallRating={player2.rating}
          position={player2.position}
          tier={calculatePlayerTier(player2.rating)}
          clubName={player2.teamName}
          skills={player2.skills}
        />
      </div>
    </div>
  );
}

export {
  calculatePlayerTier,
  calculateRatingChange,
  mapPlayerRatingToSkills,
  getPlayerInitials,
};
