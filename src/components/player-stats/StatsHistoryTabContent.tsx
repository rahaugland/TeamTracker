import { useEffect, useState, useMemo } from 'react';
import { TimePeriodSelector } from './TimePeriodSelector';
import { SkillProgressionChart } from './SkillProgressionChart';
import { StatSummaryRow } from './StatSummaryRow';
import { GameLogTable } from './GameLogTable';
import { cn } from '@/lib/utils';
import {
  getPlayerStats,
  aggregateStats,
  getGameStatLines,
  getSkillProgression,
  type TimePeriod,
  type CustomDateRange,
  type StatEntryWithEvent,
  type AggregatedStats,
  type GameStatLine,
  type SkillProgressionPoint,
} from '@/services/player-stats.service';

interface StatsHistoryTabContentProps {
  playerId: string;
  teamId?: string;
}

type SkillFilter = 'all' | 'attack' | 'serve' | 'receive' | 'block';

/**
 * Container component for Stats History tab
 * Composes: TimePeriodSelector, SkillProgressionChart, StatSummaryRow (6-card), GameLogTable
 */
export function StatsHistoryTabContent({ playerId, teamId }: StatsHistoryTabContentProps) {
  const [period, setPeriod] = useState<TimePeriod>('season');
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();
  const [statEntries, setStatEntries] = useState<StatEntryWithEvent[]>([]);
  const [skillProgression, setSkillProgression] = useState<SkillProgressionPoint[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [stats, progression] = await Promise.all([
          getPlayerStats(playerId, period, customRange, teamId),
          getSkillProgression(playerId, teamId),
        ]);

        if (!cancelled) {
          setStatEntries(stats);
          setSkillProgression(progression);
        }
      } catch (error) {
        console.error('Error loading stats history:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [playerId, teamId, period, customRange]);

  const handlePeriodChange = (newPeriod: TimePeriod, newCustomRange?: CustomDateRange) => {
    setPeriod(newPeriod);
    setCustomRange(newCustomRange);
  };

  // Calculate aggregated stats
  const aggregatedStats: AggregatedStats = useMemo(
    () => aggregateStats(statEntries),
    [statEntries]
  );

  // Calculate game stat lines
  const gameStats: GameStatLine[] = useMemo(
    () => getGameStatLines(statEntries),
    [statEntries]
  );

  // Filter skill progression by selected skill
  // Uses skill names matching the FIFA card: serve, receive, set, block, attack, dig, mental, physique
  const filteredProgression = useMemo(() => {
    if (selectedSkill === 'all') return skillProgression;

    const skillMap: Record<SkillFilter, string[]> = {
      all: [],
      attack: ['attack', 'physique'],
      serve: ['serve'],
      receive: ['receive', 'dig'],
      block: ['block', 'mental'],
    };

    const targetSkills = skillMap[selectedSkill];
    return skillProgression.filter(p =>
      targetSkills.includes(p.skillTag)
    );
  }, [skillProgression, selectedSkill]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading stats history...</p>
      </div>
    );
  }

  if (statEntries.length === 0) {
    return (
      <div className="space-y-6">
        <TimePeriodSelector
          period={period}
          customRange={customRange}
          onPeriodChange={handlePeriodChange}
          variant="buttons"
        />
        <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-12 text-center">
          <div className="w-16 h-16 rounded-lg bg-navy-80 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl opacity-50">&#128200;</span>
          </div>
          <h3 className="font-display font-bold text-lg uppercase text-white mb-2">
            No Stats Available
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Game statistics will appear here once the player has recorded stats from matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <TimePeriodSelector
        period={period}
        customRange={customRange}
        onPeriodChange={handlePeriodChange}
        variant="buttons"
      />

      {/* Skill Progression Section */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
            Skill Development Over Time
          </h3>
          <div className="flex flex-wrap gap-2">
            <SkillFilterButton
              label="All Skills"
              value="all"
              selected={selectedSkill}
              onSelect={setSelectedSkill}
            />
            <SkillFilterButton
              label="Attack"
              value="attack"
              selected={selectedSkill}
              onSelect={setSelectedSkill}
            />
            <SkillFilterButton
              label="Serve"
              value="serve"
              selected={selectedSkill}
              onSelect={setSelectedSkill}
            />
            <SkillFilterButton
              label="Receive"
              value="receive"
              selected={selectedSkill}
              onSelect={setSelectedSkill}
            />
            <SkillFilterButton
              label="Block"
              value="block"
              selected={selectedSkill}
              onSelect={setSelectedSkill}
            />
          </div>
        </div>

        {filteredProgression.length > 0 ? (
          <SkillProgressionChart progression={filteredProgression} />
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-gray-500">No progression data for selected skill</p>
          </div>
        )}
      </div>

      {/* Stats Summary Row - 6 card variant */}
      <StatSummaryRow
        aggregatedStats={aggregatedStats}
        gameStats={gameStats}
        variant="6-card"
      />

      {/* Game Log Table */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
            Recent Games
          </h3>
          <span className="text-xs text-gray-500">
            {gameStats.length} game{gameStats.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <GameLogTableCompact gameStats={gameStats.slice(0, 10)} />
        </div>
      </div>
    </div>
  );
}

// Skill filter button component
interface SkillFilterButtonProps {
  label: string;
  value: SkillFilter;
  selected: SkillFilter;
  onSelect: (value: SkillFilter) => void;
}

function SkillFilterButton({ label, value, selected, onSelect }: SkillFilterButtonProps) {
  const isActive = selected === value;

  return (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        'font-display font-semibold text-[10px] uppercase tracking-wide',
        'px-3 py-1.5 rounded-full border transition-all',
        isActive
          ? 'bg-vq-teal text-navy border-vq-teal'
          : 'bg-navy-80 text-gray-400 border-transparent hover:text-white'
      )}
    >
      {label}
    </button>
  );
}

// Compact game log table matching wireframe style
interface GameLogTableCompactProps {
  gameStats: GameStatLine[];
}

function GameLogTableCompact({ gameStats }: GameLogTableCompactProps) {
  if (gameStats.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No game data available
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-white/[0.02]">
        <tr>
          <th className="px-4 py-3 text-left font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            Date
          </th>
          <th className="px-4 py-3 text-left font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            Opponent
          </th>
          <th className="px-4 py-3 text-right font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            Kills
          </th>
          <th className="px-4 py-3 text-right font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            Kill %
          </th>
          <th className="px-4 py-3 text-right font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            Aces
          </th>
          <th className="px-4 py-3 text-right font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
            Blocks
          </th>
        </tr>
      </thead>
      <tbody>
        {gameStats.map((game) => {
          const date = new Date(game.event.start_time);
          const formattedDate = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });

          return (
            <tr
              key={game.id}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-sm text-white">{formattedDate}</td>
              <td className="px-4 py-3 text-sm text-white">
                {game.event.opponent || 'Unknown'}
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-vq-teal">
                {game.kills}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm">
                {(game.killPercentage * 100).toFixed(0)}%
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm">{game.aces}</td>
              <td className="px-4 py-3 text-right font-mono text-sm">
                {game.totalBlocks.toFixed(0)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
