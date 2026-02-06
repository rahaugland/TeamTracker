import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  getFormStreak,
  getTeamGameStats,
  getTeamRating,
  type FormStreak,
  type TeamGameStat,
  type TeamRating,
} from '@/services/team-stats.service';

interface WinRateExpansionPanelProps {
  teamId: string;
}

export function WinRateExpansionPanel({ teamId }: WinRateExpansionPanelProps) {
  const [formStreak, setFormStreak] = useState<FormStreak | null>(null);
  const [gameStats, setGameStats] = useState<TeamGameStat[]>([]);
  const [teamRating, setTeamRating] = useState<TeamRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [streak, stats, rating] = await Promise.all([
          getFormStreak(teamId),
          getTeamGameStats(teamId).catch(() => []),
          getTeamRating(teamId).catch(() => null),
        ]);
        if (!cancelled) {
          setFormStreak(streak);
          setGameStats(stats);
          setTeamRating(rating);
        }
      } catch (err) {
        console.error('Failed to load win rate data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-40 bg-white/[0.06] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Chart data from game stats (last 10)
  const performanceData = gameStats.slice(0, 10).reverse().map((g, i) => ({
    game: g.opponent ? `vs ${g.opponent.substring(0, 8)}` : `G${i + 1}`,
    killPct: Math.round(g.killPercentage),
    servePct: Math.round(g.servePercentage),
    passRtg: Math.round(g.passRating),
  }));

  // Radar data
  const radarData = teamRating ? [
    { stat: 'Attack', value: teamRating.subRatings.attack },
    { stat: 'Serve', value: teamRating.subRatings.serve },
    { stat: 'Reception', value: teamRating.subRatings.reception },
    { stat: 'Consistency', value: teamRating.subRatings.consistency },
  ] : [];

  const last3Games = gameStats.slice(0, 3);

  return (
    <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
      <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white mb-6">
        Performance Breakdown
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Form streak + Performance chart */}
        <div className="space-y-5">
          {/* Form streak badges */}
          {formStreak && formStreak.results.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Last 5 Form</p>
              <div className="flex gap-2">
                {(formStreak.results.length > 0 ? formStreak.results : []).slice(0, 5).map((r, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      r === 'W' ? 'bg-green-500/20 text-green-500'
                      : r === 'L' ? 'bg-red-500/20 text-red-500'
                      : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {r}
                  </div>
                ))}
                {formStreak.results.length === 0 && (
                  <span className="text-gray-400 text-sm">No recent games</span>
                )}
              </div>
            </div>
          )}

          {/* Performance line chart */}
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="game" tick={{ fill: '#8B95A5', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: '#8B95A5', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1e35',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="killPct" stroke="#E63946" strokeWidth={2} dot={false} name="Kill %" />
                <Line type="monotone" dataKey="servePct" stroke="#2EC4B6" strokeWidth={2} dot={false} name="Serve %" />
                <Line type="monotone" dataKey="passRtg" stroke="#34D399" strokeWidth={2} dot={false} name="Pass Rtg" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              No game stats recorded yet
            </div>
          )}
        </div>

        {/* Right: Radar chart + last 3 games */}
        <div className="space-y-5">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: '#8B95A5', fontSize: 11 }} />
                <PolarRadiusAxis tick={false} domain={[0, 99]} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="#2EC4B6"
                  fill="#2EC4B6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              Not enough data for team rating
            </div>
          )}

          {/* Last 3 games */}
          {last3Games.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Recent Results</p>
              <div className="space-y-2">
                {last3Games.map(game => (
                  <div key={game.eventId} className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-sm text-white truncate">
                      {game.opponent ? `vs ${game.opponent}` : game.eventTitle}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 font-mono">
                        {game.setsWon}-{game.setsLost}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        game.result === 'W' ? 'bg-green-500/20 text-green-500'
                        : game.result === 'L' ? 'bg-red-500/20 text-red-500'
                        : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {game.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
