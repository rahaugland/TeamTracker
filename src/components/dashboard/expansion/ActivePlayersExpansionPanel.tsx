import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types/database.types';

interface PlayerWithAttendance {
  id: string;
  name: string;
  initials: string;
  position: string;
  attendance: number;
  form: 'good' | 'poor';
}

interface ActivePlayersExpansionPanelProps {
  teamPlayers: Player[];
  playersWithAttendance: PlayerWithAttendance[];
}

const POSITION_LABELS: Record<string, string> = {
  S: 'Setter',
  OH: 'Outside Hitter',
  MB: 'Middle Blocker',
  OPP: 'Opposite',
  L: 'Libero',
  DS: 'Def. Specialist',
  AA: 'All Around',
};

const POSITION_COLORS: Record<string, string> = {
  S: '#2EC4B6',
  OH: '#E63946',
  MB: '#FFB703',
  OPP: '#8B5CF6',
  L: '#34D399',
  DS: '#F97316',
  AA: '#6B7280',
};

function getPositionAbbr(position: string): string {
  const map: Record<string, string> = {
    setter: 'S',
    outside_hitter: 'OH',
    middle_blocker: 'MB',
    opposite: 'OPP',
    libero: 'L',
    defensive_specialist: 'DS',
    all_around: 'AA',
  };
  return map[position] || position.substring(0, 2).toUpperCase();
}

export function ActivePlayersExpansionPanel({ teamPlayers, playersWithAttendance }: ActivePlayersExpansionPanelProps) {
  const navigate = useNavigate();

  // Position distribution from full roster
  const positionData = useMemo(() => {
    const counts: Record<string, number> = {};
    teamPlayers.forEach(p => {
      const pos = getPositionAbbr(p.positions?.[0] || 'all_around');
      counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.entries(counts).map(([pos, count]) => ({
      name: POSITION_LABELS[pos] || pos,
      abbr: pos,
      value: count,
      color: POSITION_COLORS[pos] || '#6B7280',
    }));
  }, [teamPlayers]);

  // Group players by position
  const playersByPosition = useMemo(() => {
    const groups: Record<string, PlayerWithAttendance[]> = {};
    playersWithAttendance.forEach(p => {
      const pos = p.position;
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(p);
    });
    return groups;
  }, [playersWithAttendance]);

  const avgAttendance = playersWithAttendance.length > 0
    ? Math.round(playersWithAttendance.reduce((sum, p) => sum + p.attendance, 0) / playersWithAttendance.length)
    : 0;

  return (
    <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
      <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white mb-6">
        Roster Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Donut chart + quick stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-[140px] h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={positionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    stroke="none"
                  >
                    {positionData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1e35',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [`${value} players`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              {positionData.map(p => (
                <div key={p.abbr} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-400">{p.abbr}</span>
                  <span className="text-white font-mono">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-white/[0.02]">
              <p className="text-xs text-gray-400">Total</p>
              <p className="font-mono text-lg font-bold text-white">{teamPlayers.length}</p>
            </div>
            <div className="p-3 rounded bg-white/[0.02]">
              <p className="text-xs text-gray-400">Avg Attendance</p>
              <p className="font-mono text-lg font-bold text-white">{avgAttendance}%</p>
            </div>
          </div>
        </div>

        {/* Right: Position-grouped player list */}
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {Object.entries(playersByPosition).map(([pos, posPlayers]) => (
            <div key={pos}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {POSITION_LABELS[pos] || pos}
              </p>
              {posPlayers.map(player => (
                <Link
                  key={player.id}
                  to={`/players/${player.id}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-sm text-white truncate flex-1">{player.name}</span>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    player.attendance >= 90 ? 'bg-green-500'
                    : player.attendance >= 70 ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`} title={`${player.attendance}% attendance`} />
                </Link>
              ))}
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/players')}
            className="w-full text-vq-teal hover:text-vq-teal hover:bg-vq-teal/10 mt-2"
          >
            View Full Roster
          </Button>
        </div>
      </div>
    </div>
  );
}
