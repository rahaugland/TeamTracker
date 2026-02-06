import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  getPlayerAttendanceRates,
  getTeamAttendanceRate,
  getDateRangePreset,
  type PlayerAttendanceRate,
  type TeamAttendanceRate,
} from '@/services/analytics.service';

interface AttendanceExpansionPanelProps {
  teamId: string;
}

type Preset = 'week' | 'month' | 'season';

function getBarColor(rate: number) {
  if (rate >= 90) return '#22c55e';
  if (rate >= 70) return '#eab308';
  return '#ef4444';
}

export function AttendanceExpansionPanel({ teamId }: AttendanceExpansionPanelProps) {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerAttendanceRate[]>([]);
  const [teamRate, setTeamRate] = useState<TeamAttendanceRate | null>(null);
  const [preset, setPreset] = useState<Preset>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const dateRange = getDateRangePreset(preset);
        const [playersData, teamData] = await Promise.all([
          getPlayerAttendanceRates(teamId, dateRange),
          getTeamAttendanceRate(teamId, dateRange),
        ]);
        if (!cancelled) {
          setPlayers(playersData);
          setTeamRate(teamData);
        }
      } catch (err) {
        console.error('Failed to load attendance data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [teamId, preset]);

  const chartData = useMemo(
    () => players.slice(0, 8).map(p => ({
      name: p.playerName.split(' ')[0],
      fullName: p.playerName,
      rate: Math.round(p.attendanceRate),
    })),
    [players]
  );

  const bestPerformer = players[0];
  const needsAttention = [...players].sort((a, b) => a.attendanceRate - b.attendanceRate)[0];
  const totalEvents = teamRate?.totalEvents ?? 0;

  const TrendIcon = teamRate?.trend === 'up' ? TrendingUp
    : teamRate?.trend === 'down' ? TrendingDown
    : Minus;

  const trendColor = teamRate?.trend === 'up' ? 'text-green-500'
    : teamRate?.trend === 'down' ? 'text-red-500'
    : 'text-gray-400';

  if (isLoading) {
    return (
      <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-32 bg-white/[0.06] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
      {/* Header with date range toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white">
          Attendance Breakdown
        </h3>
        <div className="flex gap-1 bg-navy-80 rounded-lg p-1">
          {(['week', 'month', 'season'] as Preset[]).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1 text-xs font-display font-semibold uppercase tracking-wider rounded transition-colors ${
                preset === p
                  ? 'bg-vq-teal text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Trend + Quick Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center ${trendColor}`}>
              <TrendIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-white">
                {teamRate ? `${Math.round(teamRate.averageAttendanceRate)}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 capitalize">{teamRate?.trend ?? 'stable'} trend</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Events</span>
              <span className="font-mono text-white">{totalEvents}</span>
            </div>
            {bestPerformer && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Best</span>
                <span className="text-green-500 font-mono">
                  {bestPerformer.playerName.split(' ')[0]} ({Math.round(bestPerformer.attendanceRate)}%)
                </span>
              </div>
            )}
            {needsAttention && needsAttention.attendanceRate < 80 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Needs Attention</span>
                <span className="text-red-500 font-mono">
                  {needsAttention.playerName.split(' ')[0]} ({Math.round(needsAttention.attendanceRate)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Bar Chart */}
        <div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8B95A5', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis dataKey="name" type="category" tick={{ fill: '#8B95A5', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1e35',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(value: number, _name: string, props: { payload: { fullName: string } }) => [
                    `${value}%`,
                    props.payload.fullName,
                  ]}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={getBarColor(entry.rate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              No attendance data
            </div>
          )}
        </div>

        {/* Right: Player List */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {players.slice(0, 10).map(player => (
            <div
              key={player.playerId}
              className="flex items-center gap-2 p-2 rounded hover:bg-white/[0.04] cursor-pointer transition-colors"
              onClick={() => navigate(`/players/${player.playerId}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{player.playerName}</p>
                <p className="text-xs text-gray-400">
                  {player.presentCount + player.lateCount}/{player.totalEvents} events
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 bg-navy-70 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${player.attendanceRate}%`,
                      backgroundColor: getBarColor(player.attendanceRate),
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-400 w-9 text-right">
                  {Math.round(player.attendanceRate)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
