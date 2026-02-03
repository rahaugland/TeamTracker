import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  getPlayerStats,
  calculatePlayerRating,
  type PlayerRating,
} from '@/services/player-stats.service';
import { getPlayer } from '@/services/players.service';
import { mapPlayerRatingToSkills } from '@/components/player/FifaPlayerCard.example';

interface SkillRatingWithHistory {
  type: string;
  label: string;
  abbr: string;
  value: number;
  previousValue: number | null;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface SkillRatingsPanelProps {
  playerId: string;
  teamId?: string;
}

const SKILL_COLORS: Record<string, string> = {
  serve: '#E63946',
  receive: '#2EC4B6',
  set: '#FFB703',
  block: '#3B82F6',
  attack: '#22C55E',
  dig: '#9333EA',
  mental: '#EC4899',
  physique: '#F97316',
};

/**
 * 2x4 grid showing 8 skills with current value, change indicator, label, and progress bar
 * Skills: Serve, Receive, Set, Block, Attack, Digs, Mental, Physique
 * Uses the same calculation as the FIFA Player Card for consistency
 */
export function SkillRatingsPanel({ playerId, teamId }: SkillRatingsPanelProps) {
  const [skills, setSkills] = useState<SkillRatingWithHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const loadSkills = async () => {
      setIsLoading(true);
      try {
        // Get player data for position
        const player = await getPlayer(playerId);
        const primaryPosition = player.positions[0] || 'all_around';

        // Get game stats - same data source as FIFA card
        const gameStats = await getPlayerStats(playerId, 'career', undefined, teamId);

        if (gameStats.length === 0) {
          if (!cancelled) {
            setSkills([]);
            setIsLoading(false);
          }
          return;
        }

        // Calculate player rating - same calculation as FIFA card
        const playerRating = calculatePlayerRating(gameStats, primaryPosition);

        // Map to skills - same mapping as FIFA card
        const cardSkills = mapPlayerRatingToSkills(playerRating);

        // Convert to SkillRatingWithHistory format
        const skillsWithHistory: SkillRatingWithHistory[] = cardSkills.map(skill => ({
          type: skill.type,
          label: skill.label,
          abbr: skill.abbr,
          value: skill.value,
          previousValue: null,
          change: 0,
          trend: skill.trend === 'up' ? 'up' : skill.trend === 'down' ? 'down' : 'stable',
          color: SKILL_COLORS[skill.type] || '#666',
        }));

        if (!cancelled) {
          setSkills(skillsWithHistory);
          setLastUpdated(new Date().toLocaleDateString());
        }
      } catch (err) {
        console.error('Error loading skill ratings:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSkills();
    return () => { cancelled = true; };
  }, [playerId, teamId]);

  if (isLoading) {
    return (
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6">
        <div className="h-48 flex items-center justify-center">
          <p className="text-gray-500">Loading skill ratings...</p>
        </div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6">
        <div className="h-32 flex items-center justify-center">
          <p className="text-gray-500">No skill ratings available</p>
        </div>
      </div>
    );
  }

  // Order skills in the correct display order
  const orderedSkills = reorderSkills(skills);

  return (
    <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
          Skill Ratings
        </h3>
        <span className="text-xs text-gray-500">
          Last updated: {lastUpdated} &bull; Changes vs 2 weeks ago
        </span>
      </div>

      {/* 2x4 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {orderedSkills.map((skill) => (
          <SkillRatingItem key={skill.type} skill={skill} />
        ))}
      </div>
    </div>
  );
}

// Helper to order skills in display order
function reorderSkills(skills: SkillRatingWithHistory[]): SkillRatingWithHistory[] {
  const order = ['serve', 'receive', 'set', 'block', 'attack', 'dig', 'mental', 'physique'];
  return order
    .map(type => skills.find(s => s.type === type))
    .filter((s): s is SkillRatingWithHistory => s !== undefined);
}

// Individual skill rating item component
interface SkillRatingItemProps {
  skill: SkillRatingWithHistory;
}

function SkillRatingItem({ skill }: SkillRatingItemProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '—';
    }
  };

  const getTrendClass = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'bg-green-500/15 text-green-400';
      case 'down':
        return 'bg-red-500/15 text-red-400';
      default:
        return 'bg-white/5 text-gray-500';
    }
  };

  return (
    <div
      className="bg-navy-80 rounded-lg p-4 relative overflow-hidden"
      style={{ '--skill-color': skill.color } as React.CSSProperties}
    >
      {/* Top color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: skill.color }}
      />

      {/* Value and Change */}
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono font-bold text-3xl text-white">
          {skill.value}
        </span>
        <span
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded font-mono font-semibold text-xs',
            getTrendClass(skill.trend)
          )}
        >
          {getTrendIcon(skill.trend)} {skill.change > 0 ? '+' : ''}{skill.change}
        </span>
      </div>

      {/* Label */}
      <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-gray-500 mb-3">
        {skill.label}
      </p>

      {/* Progress Bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${skill.value}%`,
            backgroundColor: skill.color,
          }}
        />
      </div>
    </div>
  );
}
