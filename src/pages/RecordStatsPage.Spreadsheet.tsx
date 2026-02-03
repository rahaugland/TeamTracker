import { cn } from '@/lib/utils';
import type { PlayerStatRow, TeamTotals } from '@/components/match-stats';

interface SpreadsheetViewProps {
  playerStats: PlayerStatRow[];
  teamTotals: TeamTotals;
  onStatChange: (playerId: string, field: keyof PlayerStatRow, value: number) => void;
  onRotationChange: (playerId: string, rotation: number | null) => void;
}

interface ColumnDef {
  key: keyof PlayerStatRow | 'killPct' | 'passRating' | 'totalBlocks';
  label: string;
  width: string;
  isCalculated?: boolean;
  category?: 'attack' | 'serve' | 'block' | 'defense' | 'passing' | 'setting' | 'playing';
}

const columns: ColumnDef[] = [
  // Attack
  { key: 'kills', label: 'K', width: 'w-12', category: 'attack' },
  { key: 'attackErrors', label: 'E', width: 'w-12', category: 'attack' },
  { key: 'attackAttempts', label: 'TA', width: 'w-12', category: 'attack' },
  { key: 'killPct', label: 'K%', width: 'w-14', isCalculated: true, category: 'attack' },
  // Serve
  { key: 'aces', label: 'A', width: 'w-12', category: 'serve' },
  { key: 'serviceErrors', label: 'SE', width: 'w-12', category: 'serve' },
  { key: 'serveAttempts', label: 'SA', width: 'w-12', category: 'serve' },
  // Block
  { key: 'blockSolos', label: 'BS', width: 'w-12', category: 'block' },
  { key: 'blockAssists', label: 'BA', width: 'w-12', category: 'block' },
  { key: 'blockTouches', label: 'BT', width: 'w-12', category: 'block' },
  { key: 'totalBlocks', label: 'TB', width: 'w-12', isCalculated: true, category: 'block' },
  // Defense
  { key: 'digs', label: 'D', width: 'w-12', category: 'defense' },
  { key: 'ballHandlingErrors', label: 'BHE', width: 'w-14', category: 'defense' },
  // Passing
  { key: 'passAttempts', label: 'PA', width: 'w-12', category: 'passing' },
  { key: 'passSum', label: 'PS', width: 'w-12', category: 'passing' },
  { key: 'passRating', label: 'PR', width: 'w-14', isCalculated: true, category: 'passing' },
  // Setting
  { key: 'setAttempts', label: 'SetA', width: 'w-14', category: 'setting' },
  { key: 'setSum', label: 'SetS', width: 'w-14', category: 'setting' },
  { key: 'settingErrors', label: 'SetE', width: 'w-14', category: 'setting' },
  // Playing Time
  { key: 'setsPlayed', label: 'SP', width: 'w-12', category: 'playing' },
  { key: 'rotationsPlayed', label: 'RP', width: 'w-12', category: 'playing' },
  { key: 'rotation', label: 'R', width: 'w-12', category: 'playing' },
];

const categoryColors: Record<string, string> = {
  attack: 'bg-green-500/10',
  serve: 'bg-red-500/10',
  block: 'bg-blue-500/10',
  defense: 'bg-purple-500/10',
  passing: 'bg-teal-500/10',
  setting: 'bg-yellow-500/10',
  playing: 'bg-gray-500/10',
};

const categoryHeaderColors: Record<string, string> = {
  attack: 'bg-green-500/20 text-green-400',
  serve: 'bg-red-500/20 text-red-400',
  block: 'bg-blue-500/20 text-blue-400',
  defense: 'bg-purple-500/20 text-purple-400',
  passing: 'bg-teal-500/20 text-teal-400',
  setting: 'bg-yellow-500/20 text-yellow-400',
  playing: 'bg-gray-500/20 text-gray-400',
};

function calculateValue(
  player: PlayerStatRow,
  key: string
): string | number {
  switch (key) {
    case 'killPct': {
      if (player.attackAttempts === 0) return '-';
      const pct = ((player.kills - player.attackErrors) / player.attackAttempts) * 100;
      return pct.toFixed(1);
    }
    case 'passRating': {
      if (player.passAttempts === 0) return '-';
      return (player.passSum / player.passAttempts).toFixed(2);
    }
    case 'totalBlocks': {
      return (player.blockSolos + player.blockAssists * 0.5).toFixed(1);
    }
    default:
      return player[key as keyof PlayerStatRow] ?? 0;
  }
}

function calculateTotalValue(
  totals: TeamTotals,
  key: string
): string | number {
  switch (key) {
    case 'killPct': {
      if (totals.attackAttempts === 0) return '-';
      const pct = ((totals.kills - totals.attackErrors) / totals.attackAttempts) * 100;
      return pct.toFixed(1);
    }
    case 'passRating': {
      if (totals.passAttempts === 0) return '-';
      return (totals.passSum / totals.passAttempts).toFixed(2);
    }
    case 'totalBlocks': {
      return (totals.blockSolos + totals.blockAssists * 0.5).toFixed(1);
    }
    case 'kills':
      return totals.kills;
    case 'attackErrors':
      return totals.attackErrors;
    case 'attackAttempts':
      return totals.attackAttempts;
    case 'aces':
      return totals.aces;
    case 'serviceErrors':
      return totals.serviceErrors;
    case 'serveAttempts':
      return totals.serveAttempts;
    case 'blockSolos':
      return totals.blockSolos;
    case 'blockAssists':
      return totals.blockAssists;
    case 'blockTouches':
      return totals.blockTouches;
    case 'digs':
      return totals.digs;
    case 'ballHandlingErrors':
      return totals.ballHandlingErrors;
    case 'passAttempts':
      return totals.passAttempts;
    case 'passSum':
      return totals.passSum;
    case 'setAttempts':
      return totals.setAttempts;
    case 'setSum':
      return totals.setSum;
    case 'settingErrors':
      return totals.settingErrors;
    default:
      return '-';
  }
}

/**
 * SpreadsheetView component
 * Data-table view for recording all player stats in a spreadsheet format
 */
export function SpreadsheetView({
  playerStats,
  teamTotals,
  onStatChange,
  onRotationChange,
}: SpreadsheetViewProps) {
  const handleCellChange = (
    playerId: string,
    column: ColumnDef,
    value: string
  ) => {
    if (column.isCalculated) return;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    if (column.key === 'rotation') {
      const rotation = numValue >= 1 && numValue <= 6 ? numValue : null;
      onRotationChange(playerId, rotation);
    } else {
      onStatChange(playerId, column.key as keyof PlayerStatRow, Math.max(0, numValue));
    }
  };

  // Group columns by category for headers
  const categoryGroups = [
    { name: 'Attack', category: 'attack', cols: columns.filter((c) => c.category === 'attack') },
    { name: 'Serve', category: 'serve', cols: columns.filter((c) => c.category === 'serve') },
    { name: 'Block', category: 'block', cols: columns.filter((c) => c.category === 'block') },
    { name: 'Defense', category: 'defense', cols: columns.filter((c) => c.category === 'defense') },
    { name: 'Passing', category: 'passing', cols: columns.filter((c) => c.category === 'passing') },
    { name: 'Setting', category: 'setting', cols: columns.filter((c) => c.category === 'setting') },
    { name: 'Playing', category: 'playing', cols: columns.filter((c) => c.category === 'playing') },
  ];

  return (
    <div className="bg-navy-90 border border-white/5 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Category Headers */}
          <thead>
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-20 bg-navy-90 px-4 py-2 text-left w-40" />
              {categoryGroups.map((group) => (
                <th
                  key={group.category}
                  colSpan={group.cols.length}
                  className={cn(
                    'px-2 py-1 text-center font-display font-semibold text-xs uppercase tracking-wider',
                    categoryHeaderColors[group.category]
                  )}
                >
                  {group.name}
                </th>
              ))}
            </tr>
            {/* Column Headers */}
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-20 bg-navy-90 px-4 py-2 text-left text-gray-400 font-display font-semibold text-xs uppercase tracking-wider w-40">
                Player
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-2 py-2 text-center font-mono text-xs text-gray-400',
                    col.width,
                    col.isCalculated && 'text-vq-teal'
                  )}
                  title={col.label}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerStats.map((player, index) => (
              <tr
                key={player.playerId}
                className={cn(
                  'border-b border-white/5 hover:bg-white/5 transition-colors',
                  index % 2 === 0 ? 'bg-navy-90' : 'bg-navy-80/30'
                )}
              >
                {/* Player Name - Sticky */}
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2">
                  <span className="font-display font-semibold text-white truncate block w-36">
                    {player.playerName}
                  </span>
                </td>
                {/* Stat Cells */}
                {columns.map((col) => {
                  const value = calculateValue(player, col.key);
                  const isEditable = !col.isCalculated;

                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-1 py-1 text-center',
                        col.width,
                        categoryColors[col.category || '']
                      )}
                    >
                      {isEditable ? (
                        <input
                          type="number"
                          min={col.key === 'rotation' ? 1 : 0}
                          max={col.key === 'rotation' ? 6 : undefined}
                          value={value === null ? '' : value}
                          onChange={(e) =>
                            handleCellChange(player.playerId, col, e.target.value)
                          }
                          className={cn(
                            'w-full bg-transparent text-center font-mono text-sm text-white',
                            'border border-transparent rounded px-1 py-1',
                            'hover:border-white/20 focus:border-vq-teal focus:outline-none',
                            'transition-colors',
                            '[appearance:textfield]',
                            '[&::-webkit-outer-spin-button]:appearance-none',
                            '[&::-webkit-inner-spin-button]:appearance-none'
                          )}
                        />
                      ) : (
                        <span className="font-mono text-sm text-vq-teal font-medium">
                          {value}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Team Totals Row */}
            <tr className="bg-navy-80 border-t-2 border-vq-teal/30">
              <td className="sticky left-0 z-10 bg-navy-80 px-4 py-3">
                <span className="font-display font-bold text-vq-teal uppercase text-xs tracking-wider">
                  Team Totals
                </span>
              </td>
              {columns.map((col) => {
                // Skip playing time columns for totals
                if (col.category === 'playing') {
                  return (
                    <td
                      key={col.key}
                      className={cn('px-1 py-2 text-center', col.width)}
                    >
                      <span className="font-mono text-sm text-gray-500">-</span>
                    </td>
                  );
                }

                const value = calculateTotalValue(teamTotals, col.key);

                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-1 py-2 text-center',
                      col.width,
                      categoryColors[col.category || '']
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-sm font-bold',
                        col.isCalculated ? 'text-vq-teal' : 'text-white'
                      )}
                    >
                      {value}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-white/5 text-xs text-gray-500">
        <span>
          <strong className="text-gray-400">K</strong>=Kills
        </span>
        <span>
          <strong className="text-gray-400">E</strong>=Errors
        </span>
        <span>
          <strong className="text-gray-400">TA</strong>=Total Attempts
        </span>
        <span>
          <strong className="text-gray-400">A</strong>=Aces
        </span>
        <span>
          <strong className="text-gray-400">SE</strong>=Service Errors
        </span>
        <span>
          <strong className="text-gray-400">BS/BA</strong>=Block Solo/Assist
        </span>
        <span>
          <strong className="text-gray-400">D</strong>=Digs
        </span>
        <span>
          <strong className="text-gray-400">BHE</strong>=Ball Handling Errors
        </span>
        <span>
          <strong className="text-vq-teal">Calculated</strong>=Auto-computed
        </span>
      </div>
    </div>
  );
}
