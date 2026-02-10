import { supabase } from '@/lib/supabase';
import {
  getPlayerStats,
  calculatePlayerRating,
  aggregateStats,
  type StatEntryWithEvent,
  type PlayerRating,
  type AggregatedStats,
} from './player-stats.service';
import type { DateRange } from './analytics.service';
import type { VolleyballPosition } from '@/types/database.types';

// ---- Player Rankings ----

export interface PlayerRankingEntry {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  position: VolleyballPosition;
  jerseyNumber?: number;
  rating: PlayerRating;
  aggregated: AggregatedStats;
}

export async function getTeamPlayerRankings(
  teamId: string,
  dateRange?: DateRange
): Promise<PlayerRankingEntry[]> {
  const { data: memberships, error } = await supabase
    .from('team_memberships')
    .select(`
      player_id,
      jersey_number,
      player:players(id, name, photo_url, positions)
    `)
    .eq('team_id', teamId)
    .eq('is_active', true);

  if (error) throw error;
  if (!memberships || memberships.length === 0) return [];

  const results = await Promise.all(
    memberships.map(async (m: any) => {
      const playerId = m.player_id;
      const primaryPosition: VolleyballPosition = m.player?.positions?.[0] || 'all_around';

      // Always use career stats for rating to match player cards
      const entries = await getPlayerStats(
        playerId,
        'career',
        undefined,
        teamId
      );

      const rating = calculatePlayerRating(entries, primaryPosition);
      const aggregated = aggregateStats(entries);

      return {
        playerId: m.player.id,
        playerName: m.player.name,
        photoUrl: m.player.photo_url,
        position: primaryPosition,
        jerseyNumber: m.jersey_number,
        rating,
        aggregated,
      } as PlayerRankingEntry;
    })
  );

  return results.sort((a, b) => b.rating.overall - a.rating.overall);
}

export type LeaderboardStat =
  | 'kills'
  | 'aces'
  | 'digs'
  | 'blocks'
  | 'passRating'
  | 'killPct'
  | 'servePct';

export interface StatLeaderboardEntry {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  value: number;
  gamesPlayed: number;
}

export async function getStatLeaderboard(
  teamId: string,
  stat: LeaderboardStat,
  dateRange?: DateRange,
  limit = 10
): Promise<StatLeaderboardEntry[]> {
  const rankings = await getTeamPlayerRankings(teamId, dateRange);

  const mapped = rankings.map((r) => {
    let value = 0;
    switch (stat) {
      case 'kills':
        value = r.aggregated.killsPerGame;
        break;
      case 'aces':
        value = r.aggregated.acesPerGame;
        break;
      case 'digs':
        value = r.aggregated.digsPerGame;
        break;
      case 'blocks':
        value = r.aggregated.blocksPerGame;
        break;
      case 'passRating':
        value = r.aggregated.passRating;
        break;
      case 'killPct':
        value = r.aggregated.killPercentage * 100;
        break;
      case 'servePct':
        value = r.aggregated.servePercentage * 100;
        break;
    }
    return {
      playerId: r.playerId,
      playerName: r.playerName,
      photoUrl: r.photoUrl,
      value: Math.round(value * 10) / 10,
      gamesPlayed: r.rating.gamesPlayed,
    };
  });

  return [...mapped].sort((a, b) => b.value - a.value).slice(0, limit);
}

// ---- Drill Effectiveness ----

export interface DrillEffectivenessEntry {
  drillId: string;
  drillName: string;
  executionCount: number;
  avgCoachRating: number | null;
  skillTags: string[];
  totalMinutes: number;
}

export async function getDrillEffectiveness(
  teamId: string,
  dateRange?: DateRange
): Promise<DrillEffectivenessEntry[]> {
  let query = supabase
    .from('drill_executions')
    .select(`
      drill_id,
      duration_minutes,
      coach_rating,
      executed_at,
      drill:drills(id, name, skill_tags)
    `)
    .eq('team_id', teamId);

  if (dateRange) {
    query = query
      .gte('executed_at', dateRange.startDate)
      .lte('executed_at', dateRange.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const drillMap = new Map<string, {
    name: string;
    count: number;
    ratingSum: number;
    ratingCount: number;
    skillTags: string[];
    totalMinutes: number;
  }>();

  for (const exec of data as any[]) {
    const id = exec.drill_id;
    if (!drillMap.has(id)) {
      drillMap.set(id, {
        name: exec.drill?.name || 'Unknown',
        count: 0,
        ratingSum: 0,
        ratingCount: 0,
        skillTags: exec.drill?.skill_tags || [],
        totalMinutes: 0,
      });
    }
    const d = drillMap.get(id)!;
    d.count++;
    d.totalMinutes += exec.duration_minutes || 0;
    if (exec.coach_rating) {
      d.ratingSum += exec.coach_rating;
      d.ratingCount++;
    }
  }

  return Array.from(drillMap.entries())
    .map(([drillId, d]) => ({
      drillId,
      drillName: d.name,
      executionCount: d.count,
      avgCoachRating: d.ratingCount > 0 ? Math.round((d.ratingSum / d.ratingCount) * 10) / 10 : null,
      skillTags: d.skillTags,
      totalMinutes: d.totalMinutes,
    }))
    .sort((a, b) => b.executionCount - a.executionCount);
}

export interface SkillTrainingVolume {
  month: string;
  [skillTag: string]: number | string;
}

export async function getTeamTrainingVolume(
  teamId: string,
  dateRange?: DateRange
): Promise<SkillTrainingVolume[]> {
  let query = supabase
    .from('drill_executions')
    .select(`
      executed_at,
      duration_minutes,
      drill:drills(skill_tags)
    `)
    .eq('team_id', teamId)
    .order('executed_at', { ascending: true });

  if (dateRange) {
    query = query
      .gte('executed_at', dateRange.startDate)
      .lte('executed_at', dateRange.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const monthlyVolume: Record<string, Record<string, number>> = {};

  for (const exec of data as any[]) {
    const month = exec.executed_at.substring(0, 7);
    const skillTags: string[] = exec.drill?.skill_tags || [];
    const minutes = exec.duration_minutes || 0;

    if (!monthlyVolume[month]) monthlyVolume[month] = {};

    for (const tag of skillTags) {
      monthlyVolume[month][tag] = (monthlyVolume[month][tag] || 0) + minutes;
    }
  }

  return Object.entries(monthlyVolume)
    .map(([month, skills]) => ({ month, ...skills }))
    .sort((a, b) => (a.month as string).localeCompare(b.month as string));
}

export interface DrillProgressionEntry {
  month: string;
  drillName: string;
  avgRating: number;
}

export async function getDrillProgression(
  teamId: string,
  dateRange?: DateRange
): Promise<DrillProgressionEntry[]> {
  let query = supabase
    .from('drill_executions')
    .select(`
      executed_at,
      coach_rating,
      drill:drills(name)
    `)
    .eq('team_id', teamId)
    .not('coach_rating', 'is', null)
    .order('executed_at', { ascending: true });

  if (dateRange) {
    query = query
      .gte('executed_at', dateRange.startDate)
      .lte('executed_at', dateRange.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const grouped: Record<string, { sum: number; count: number; name: string }> = {};

  for (const exec of data as any[]) {
    const month = exec.executed_at.substring(0, 7);
    const name = exec.drill?.name || 'Unknown';
    const key = `${month}::${name}`;
    if (!grouped[key]) grouped[key] = { sum: 0, count: 0, name };
    grouped[key].sum += exec.coach_rating;
    grouped[key].count++;
  }

  return Object.entries(grouped).map(([key, v]) => {
    const [month] = key.split('::');
    return {
      month,
      drillName: v.name,
      avgRating: Math.round((v.sum / v.count) * 10) / 10,
    };
  });
}

// ---- Game Analysis ----

export interface OpponentTierAnalysis {
  tier: number;
  tierLabel: string;
  wins: number;
  losses: number;
  winPct: number;
  avgKillPct: number;
  avgServePct: number;
  gamesPlayed: number;
}

export async function getPerformanceByOpponentTier(
  teamId: string,
  dateRange?: DateRange
): Promise<OpponentTierAnalysis[]> {
  let query = supabase
    .from('events')
    .select('id, opponent_tier, sets_won, sets_lost')
    .eq('team_id', teamId)
    .in('type', ['game', 'tournament'])
    .not('sets_won', 'is', null)
    .not('sets_lost', 'is', null);

  if (dateRange) {
    query = query
      .gte('start_time', dateRange.startDate)
      .lte('start_time', dateRange.endDate);
  }

  const { data: events, error } = await query;
  if (error) throw error;
  if (!events || events.length === 0) return [];

  const eventIds = events.map((e: any) => e.id);

  const { data: stats } = await supabase
    .from('stat_entries')
    .select('event_id, kills, attack_errors, attack_attempts, aces, service_errors, serve_attempts')
    .in('event_id', eventIds);

  // Aggregate stats by event
  const eventStatsMap = new Map<string, { killPct: number; servePct: number }>();
  if (stats) {
    const byEvent = new Map<string, any[]>();
    for (const s of stats) {
      if (!byEvent.has(s.event_id)) byEvent.set(s.event_id, []);
      byEvent.get(s.event_id)!.push(s);
    }
    for (const [eventId, entries] of byEvent) {
      let k = 0, ae = 0, aa = 0, a = 0, se = 0, sa = 0;
      for (const e of entries) {
        k += e.kills; ae += e.attack_errors; aa += e.attack_attempts;
        a += e.aces; se += e.service_errors; sa += e.serve_attempts;
      }
      eventStatsMap.set(eventId, {
        killPct: aa > 0 ? ((k - ae) / aa) * 100 : 0,
        servePct: sa > 0 ? ((sa - se) / sa) * 100 : 0,
      });
    }
  }

  const tierLabels: Record<number, string> = {
    1: 'Beginner', 2: 'Novice', 3: 'Developing', 4: 'Intermediate',
    5: 'Competitive', 6: 'Advanced', 7: 'Elite', 8: 'National', 9: 'World Class',
  };

  const tierMap = new Map<number, { wins: number; losses: number; killPcts: number[]; servePcts: number[] }>();

  for (const event of events as any[]) {
    const tier = event.opponent_tier || 5;
    if (!tierMap.has(tier)) tierMap.set(tier, { wins: 0, losses: 0, killPcts: [], servePcts: [] });
    const t = tierMap.get(tier)!;

    if (event.sets_won > event.sets_lost) t.wins++;
    else t.losses++;

    const es = eventStatsMap.get(event.id);
    if (es) {
      t.killPcts.push(es.killPct);
      t.servePcts.push(es.servePct);
    }
  }

  return Array.from(tierMap.entries())
    .map(([tier, d]) => ({
      tier,
      tierLabel: tierLabels[tier] || `Tier ${tier}`,
      wins: d.wins,
      losses: d.losses,
      winPct: d.wins + d.losses > 0 ? Math.round((d.wins / (d.wins + d.losses)) * 100) : 0,
      avgKillPct: d.killPcts.length > 0 ? Math.round((d.killPcts.reduce((a, b) => a + b, 0) / d.killPcts.length) * 10) / 10 : 0,
      avgServePct: d.servePcts.length > 0 ? Math.round((d.servePcts.reduce((a, b) => a + b, 0) / d.servePcts.length) * 10) / 10 : 0,
      gamesPlayed: d.wins + d.losses,
    }))
    .sort((a, b) => a.tier - b.tier);
}

export interface SetScoreAnalysis {
  totalSetsWon: number;
  totalSetsLost: number;
  closeSetsWon: number;
  closeSetsLost: number;
  avgPointDifferential: number;
}

export async function getSetScoreAnalysis(
  teamId: string,
  dateRange?: DateRange
): Promise<SetScoreAnalysis> {
  let query = supabase
    .from('events')
    .select('sets_won, sets_lost, set_scores')
    .eq('team_id', teamId)
    .in('type', ['game', 'tournament'])
    .not('sets_won', 'is', null);

  if (dateRange) {
    query = query
      .gte('start_time', dateRange.startDate)
      .lte('start_time', dateRange.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  let totalSetsWon = 0;
  let totalSetsLost = 0;
  let closeSetsWon = 0;
  let closeSetsLost = 0;
  let pointDiffSum = 0;
  let setCount = 0;

  for (const event of (data || []) as any[]) {
    totalSetsWon += event.sets_won || 0;
    totalSetsLost += event.sets_lost || 0;

    if (event.set_scores && Array.isArray(event.set_scores)) {
      for (const set of event.set_scores) {
        if (Array.isArray(set) && set.length === 2) {
          const [our, their] = set;
          const diff = our - their;
          pointDiffSum += diff;
          setCount++;

          const isClose = Math.abs(diff) <= 3;
          if (isClose) {
            if (diff > 0) closeSetsWon++;
            else closeSetsLost++;
          }
        }
      }
    }
  }

  return {
    totalSetsWon,
    totalSetsLost,
    closeSetsWon,
    closeSetsLost,
    avgPointDifferential: setCount > 0 ? Math.round((pointDiffSum / setCount) * 10) / 10 : 0,
  };
}

export interface OpponentHistory {
  opponent: string;
  wins: number;
  losses: number;
  lastPlayed: string;
  gamesPlayed: number;
}

export async function getOpponentHistory(
  teamId: string,
  dateRange?: DateRange
): Promise<OpponentHistory[]> {
  let query = supabase
    .from('events')
    .select('opponent, sets_won, sets_lost, start_time')
    .eq('team_id', teamId)
    .in('type', ['game', 'tournament'])
    .not('opponent', 'is', null)
    .not('sets_won', 'is', null)
    .order('start_time', { ascending: false });

  if (dateRange) {
    query = query
      .gte('start_time', dateRange.startDate)
      .lte('start_time', dateRange.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const oppMap = new Map<string, { wins: number; losses: number; lastPlayed: string }>();

  for (const event of data as any[]) {
    const opp = event.opponent;
    if (!opp) continue;
    if (!oppMap.has(opp)) oppMap.set(opp, { wins: 0, losses: 0, lastPlayed: event.start_time });
    const o = oppMap.get(opp)!;
    if (event.sets_won > event.sets_lost) o.wins++;
    else o.losses++;
  }

  return Array.from(oppMap.entries())
    .map(([opponent, d]) => ({
      opponent,
      wins: d.wins,
      losses: d.losses,
      lastPlayed: d.lastPlayed,
      gamesPlayed: d.wins + d.losses,
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}
