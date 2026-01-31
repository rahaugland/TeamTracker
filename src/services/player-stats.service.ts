import { supabase } from '@/lib/supabase';
import type { StatEntry, Event, VolleyballPosition, AttendanceRecord, AttendanceStatus } from '@/types/database.types';

/**
 * Player Stats Service
 * Handles stat queries, aggregation, and rating calculations for player stats page
 */

export interface StatEntryWithEvent extends StatEntry {
  event: Event;
}

export interface AggregatedStats {
  gamesPlayed: number;
  totalKills: number;
  totalAttackAttempts: number;
  totalAttackErrors: number;
  totalAces: number;
  totalServiceErrors: number;
  totalServeAttempts: number;
  totalDigs: number;
  totalBlockSolos: number;
  totalBlockAssists: number;
  totalBlockTouches: number;
  totalPassAttempts: number;
  totalPassSum: number;
  totalSetAttempts: number;
  totalSetSum: number;
  totalSettingErrors: number;
  totalBallHandlingErrors: number;
  totalSetsPlayed: number;
  totalRotationsPlayed: number;

  // Calculated rates
  killPercentage: number;
  servePercentage: number;
  passRating: number;
  setRating: number;
  errorRate: number;

  // Per-game averages
  killsPerGame: number;
  acesPerGame: number;
  digsPerGame: number;
  blocksPerGame: number;
}

export interface RotationStats {
  rotation: number;
  gamesInRotation: number;
  killPercentage: number;
  passRating: number;
  digs: number;
  isBelowAverage: boolean;
}

export interface SubRatings {
  attack: number;    // 1-99
  serve: number;     // 1-99
  reception: number; // 1-99
  consistency: number; // 1-99
}

export interface PlayerRating {
  overall: number;
  subRatings: SubRatings;
  aggregatedStats: AggregatedStats;
  isProvisional: boolean;  // true if fewer than 3 games
  gamesPlayed: number;
}

export interface GameStatLine extends StatEntry {
  event: {
    id: string;
    title: string;
    start_time: string;
    opponent?: string;
    opponent_tier?: number;
  };
  killPercentage: number;
  servePercentage: number;
  passRating: number;
  setRating: number;
  totalBlocks: number;
}

export interface PlayerForm {
  practicesAttended: number;
  practicesTotal: number; // always 10 (or fewer if less than 10 practices exist)
  formRating: number; // 1-99 scale, capped at 8/10 attendance for max
}

export interface AttendanceStats {
  totalEvents: number;
  attended: number;
  absent: number;
  late: number;
  excused: number;
  notSelected: number;
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface EventTypeBreakdown {
  practice: number;
  game: number;
  tournament: number;
  other: number;
}

export interface MissedEvent {
  date: string;
  status: AttendanceStatus;
}

export interface DrillParticipation {
  skillTag: string;
  drillCount: number;
  totalMinutes: number;
  avgProgressionLevel: number;
}

export interface SkillProgressionPoint {
  date: string;
  skillTag: string;
  avgLevel: number;
}

export interface TrainingVolumePoint {
  month: string;
  [skillTag: string]: number | string;
}

export type TimePeriod = 'game' | 'season' | 'career' | 'custom';

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

// Position weight profiles for rating calculation
const POSITION_WEIGHTS: Record<VolleyballPosition, { attack: number; serve: number; reception: number; consistency: number }> = {
  outside_hitter: { attack: 0.35, serve: 0.20, reception: 0.25, consistency: 0.20 },
  opposite: { attack: 0.40, serve: 0.20, reception: 0.15, consistency: 0.25 },
  middle_blocker: { attack: 0.35, serve: 0.15, reception: 0.15, consistency: 0.35 },
  setter: { attack: 0.10, serve: 0.20, reception: 0.40, consistency: 0.30 },
  libero: { attack: 0.00, serve: 0.00, reception: 0.60, consistency: 0.40 },
  defensive_specialist: { attack: 0.05, serve: 0.15, reception: 0.50, consistency: 0.30 },
  all_around: { attack: 0.25, serve: 0.25, reception: 0.25, consistency: 0.25 },
};

// Opponent tier maximum rating ceiling
const TIER_MAX_RATING: Record<number, number> = {
  1: 15,  // Beginner
  2: 25,  // Novice
  3: 35,  // Developing
  4: 45,  // Intermediate
  5: 55,  // Competitive
  6: 65,  // Advanced
  7: 75,  // Elite
  8: 87,  // National
  9: 99,  // World Class
};

/**
 * Bayesian prior function to prevent small sample sizes from inflating stats
 */
function bayesianRate(actual: number, attempts: number, priorRate: number, priorWeight: number): number {
  const priorValue = priorRate * priorWeight;
  return (actual + priorValue) / (attempts + priorWeight);
}

/**
 * Get recency weight for a game based on how long ago it was played
 */
function getRecencyWeight(gameDate: string): number {
  const daysAgo = (Date.now() - new Date(gameDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0.3, 1.0 - (daysAgo / 120)); // Linear decay over 4 months, floor at 0.3
}

/**
 * Get all stat entries for a player with event details
 */
export async function getPlayerStats(
  playerId: string,
  period: TimePeriod = 'career',
  customRange?: CustomDateRange,
  teamId?: string,
  seasonId?: string
): Promise<StatEntryWithEvent[]> {
  let query = supabase
    .from('stat_entries')
    .select(`
      *,
      event:events(
        id,
        title,
        start_time,
        end_time,
        type,
        opponent,
        opponent_tier,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .order('recorded_at', { ascending: false });

  // Apply filters based on period
  if (period === 'custom' && customRange) {
    query = query
      .gte('event.start_time', customRange.startDate)
      .lte('event.start_time', customRange.endDate);
  }

  if (teamId) {
    query = query.eq('event.team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }

  return (data || []) as StatEntryWithEvent[];
}

/**
 * Calculate aggregated stats from stat entries
 */
export function aggregateStats(statEntries: StatEntryWithEvent[]): AggregatedStats {
  const gamesPlayed = statEntries.length;

  if (gamesPlayed === 0) {
    return {
      gamesPlayed: 0,
      totalKills: 0,
      totalAttackAttempts: 0,
      totalAttackErrors: 0,
      totalAces: 0,
      totalServiceErrors: 0,
      totalServeAttempts: 0,
      totalDigs: 0,
      totalBlockSolos: 0,
      totalBlockAssists: 0,
      totalBlockTouches: 0,
      totalPassAttempts: 0,
      totalPassSum: 0,
      totalSetAttempts: 0,
      totalSetSum: 0,
      totalSettingErrors: 0,
      totalBallHandlingErrors: 0,
      totalSetsPlayed: 0,
      totalRotationsPlayed: 0,
      killPercentage: 0,
      servePercentage: 0,
      passRating: 0,
      setRating: 0,
      errorRate: 0,
      killsPerGame: 0,
      acesPerGame: 0,
      digsPerGame: 0,
      blocksPerGame: 0,
    };
  }

  const totals = statEntries.reduce(
    (acc, stat) => ({
      kills: acc.kills + stat.kills,
      attackAttempts: acc.attackAttempts + stat.attack_attempts,
      attackErrors: acc.attackErrors + stat.attack_errors,
      aces: acc.aces + stat.aces,
      serviceErrors: acc.serviceErrors + stat.service_errors,
      serveAttempts: acc.serveAttempts + stat.serve_attempts,
      digs: acc.digs + stat.digs,
      blockSolos: acc.blockSolos + stat.block_solos,
      blockAssists: acc.blockAssists + stat.block_assists,
      blockTouches: acc.blockTouches + stat.block_touches,
      passAttempts: acc.passAttempts + stat.pass_attempts,
      passSum: acc.passSum + stat.pass_sum,
      setAttempts: acc.setAttempts + (stat.set_attempts || 0),
      setSum: acc.setSum + (stat.set_sum || 0),
      settingErrors: acc.settingErrors + (stat.setting_errors || 0),
      ballHandlingErrors: acc.ballHandlingErrors + stat.ball_handling_errors,
      setsPlayed: acc.setsPlayed + stat.sets_played,
      rotationsPlayed: acc.rotationsPlayed + stat.rotations_played,
    }),
    {
      kills: 0,
      attackAttempts: 0,
      attackErrors: 0,
      aces: 0,
      serviceErrors: 0,
      serveAttempts: 0,
      digs: 0,
      blockSolos: 0,
      blockAssists: 0,
      blockTouches: 0,
      passAttempts: 0,
      passSum: 0,
      setAttempts: 0,
      setSum: 0,
      settingErrors: 0,
      ballHandlingErrors: 0,
      setsPlayed: 0,
      rotationsPlayed: 0,
    }
  );

  const killPercentage = totals.attackAttempts > 0
    ? (totals.kills - totals.attackErrors) / totals.attackAttempts
    : 0;

  const servePercentage = totals.serveAttempts > 0
    ? (totals.serveAttempts - totals.serviceErrors) / totals.serveAttempts
    : 0;

  const passRating = totals.passAttempts > 0
    ? totals.passSum / totals.passAttempts
    : 0;

  const setRating = totals.setAttempts > 0
    ? totals.setSum / totals.setAttempts
    : 0;

  const totalAttempts = totals.attackAttempts + totals.serveAttempts + totals.passAttempts;
  const totalErrors = totals.attackErrors + totals.serviceErrors + totals.ballHandlingErrors;
  const errorRate = totalAttempts > 0 ? totalErrors / totalAttempts : 0;

  const totalBlocks = totals.blockSolos + totals.blockAssists * 0.5;

  return {
    gamesPlayed,
    totalKills: totals.kills,
    totalAttackAttempts: totals.attackAttempts,
    totalAttackErrors: totals.attackErrors,
    totalAces: totals.aces,
    totalServiceErrors: totals.serviceErrors,
    totalServeAttempts: totals.serveAttempts,
    totalDigs: totals.digs,
    totalBlockSolos: totals.blockSolos,
    totalBlockAssists: totals.blockAssists,
    totalBlockTouches: totals.blockTouches,
    totalPassAttempts: totals.passAttempts,
    totalPassSum: totals.passSum,
    totalSetAttempts: totals.setAttempts,
    totalSetSum: totals.setSum,
    totalSettingErrors: totals.settingErrors,
    totalBallHandlingErrors: totals.ballHandlingErrors,
    totalSetsPlayed: totals.setsPlayed,
    totalRotationsPlayed: totals.rotationsPlayed,
    killPercentage,
    servePercentage,
    passRating,
    setRating,
    errorRate,
    killsPerGame: totals.kills / gamesPlayed,
    acesPerGame: totals.aces / gamesPlayed,
    digsPerGame: totals.digs / gamesPlayed,
    blocksPerGame: totalBlocks / gamesPlayed,
  };
}

/**
 * Calculate sub-ratings (1-99 scale) using new Bayesian formulas
 */
export function calculateSubRatings(stats: AggregatedStats): SubRatings {
  // Attack (efficiency-based, errors drag score down)
  // Apply Bayesian prior: 15 prior attempts, 30% baseline efficiency
  const effectiveAttackEfficiency = stats.totalAttackAttempts > 0
    ? bayesianRate(stats.totalKills - stats.totalAttackErrors, stats.totalAttackAttempts, 0.30, 15)
    : 0;
  // Map to 1-99: 0.600 efficiency = 99, 0.0 = 1
  const attack = Math.max(1, Math.min(99, Math.round(effectiveAttackEfficiency * 165)));

  // Serve (aces rewarded, errors punished)
  const effectiveAceRate = stats.totalServeAttempts > 0
    ? bayesianRate(stats.totalAces, stats.totalServeAttempts, 0.05, 15)
    : 0;
  const effectiveServeErrorRate = stats.totalServeAttempts > 0
    ? bayesianRate(stats.totalServiceErrors, stats.totalServeAttempts, 0.10, 15)
    : 0;
  const serveScore = (effectiveAceRate * 3) + (1 - effectiveServeErrorRate); // range ~0 to ~1.3
  // Map to 1-99: 1.3 = 99
  const serve = Math.max(1, Math.min(99, Math.round(serveScore * 76)));

  // Reception (pass rating 0-3 scale)
  const effectivePassRating = stats.totalPassAttempts > 0
    ? bayesianRate(stats.totalPassSum, stats.totalPassAttempts, 1.5, 10) // prior: 1.5 avg, 10 attempts weight
    : 0;
  // Map to 1-99: 3.0 = 99
  const reception = Math.max(1, Math.min(99, Math.round(effectivePassRating * 33)));

  // Consistency (low errors = high rating)
  // errorRate of 0% = 99, 15% = 50, 30%+ = ~1
  // Formula: 99 × (1 - errorRate/0.30)^1.2 — steeper curve, 30% errors = 1
  const totalErrors = stats.totalAttackErrors + stats.totalServiceErrors + stats.totalBallHandlingErrors;
  const totalActions = stats.totalAttackAttempts + stats.totalServeAttempts + stats.totalPassAttempts;
  // Apply Bayesian prior: assume 15% error rate baseline, 20 prior actions
  const effectiveErrorRate = totalActions > 0
    ? bayesianRate(totalErrors, totalActions, 0.15, 20)
    : 0.15;
  const consistencyRaw = Math.pow(Math.max(0, 1 - effectiveErrorRate / 0.30), 1.2) * 99;
  const consistency = Math.max(1, Math.min(99, Math.round(consistencyRaw)));

  return {
    attack,
    serve,
    reception,
    consistency,
  };
}

/**
 * Calculate overall rating using per-game ratings with opponent tier ceiling and recency weighting
 */
export function calculatePlayerRating(
  statEntries: StatEntryWithEvent[],
  position: VolleyballPosition
): PlayerRating {
  const aggregatedStats = aggregateStats(statEntries);
  const rawSubRatings = calculateSubRatings(aggregatedStats);
  const weights = POSITION_WEIGHTS[position];
  const gamesPlayed = statEntries.length;
  const isProvisional = gamesPlayed < 3;

  if (gamesPlayed === 0) {
    return {
      overall: 1,
      subRatings: rawSubRatings,
      aggregatedStats,
      isProvisional: true,
      gamesPlayed: 0,
    };
  }

  // Calculate recency-weighted average opponent tier ceiling
  // This is used to scale the displayed sub-ratings
  let tierWeightSum = 0;
  let tierWeightedMax = 0;

  // Calculate per-game ratings with opponent tier ceiling
  const gameRatings = statEntries.map(game => {
    // Calculate sub-ratings for this single game
    const gameAggregated = aggregateStats([game]);
    const gameSubRatings = calculateSubRatings(gameAggregated);

    // Calculate weighted performance score (1-99)
    const performanceScore =
      gameSubRatings.attack * weights.attack +
      gameSubRatings.serve * weights.serve +
      gameSubRatings.reception * weights.reception +
      gameSubRatings.consistency * weights.consistency;

    // Get opponent tier maximum rating (default to tier 5 = 55 if not set)
    const opponentTier = game.event.opponent_tier || 5;
    const opponentMax = TIER_MAX_RATING[opponentTier] || 55;

    // Game rating is capped by opponent tier
    const gameRating = opponentMax * (performanceScore / 99);

    // Get recency weight for this game
    const recencyWeight = getRecencyWeight(game.event.start_time);

    // Accumulate for weighted average tier ceiling
    tierWeightSum += recencyWeight;
    tierWeightedMax += opponentMax * recencyWeight;

    return { rating: gameRating, weight: recencyWeight };
  });

  // Calculate overall rating as recency-weighted average
  const totalWeight = gameRatings.reduce((sum, g) => sum + g.weight, 0);
  const weightedSum = gameRatings.reduce((sum, g) => sum + (g.rating * g.weight), 0);
  const overall = Math.max(1, Math.min(99, Math.round(weightedSum / totalWeight)));

  // Scale sub-ratings by the weighted average opponent tier ceiling
  // This ensures sub-ratings are consistent with the overall rating
  const avgOpponentMax = tierWeightedMax / tierWeightSum;
  const tierScale = avgOpponentMax / 99;
  const subRatings: SubRatings = {
    attack: Math.max(1, Math.min(99, Math.round(rawSubRatings.attack * tierScale))),
    serve: Math.max(1, Math.min(99, Math.round(rawSubRatings.serve * tierScale))),
    reception: Math.max(1, Math.min(99, Math.round(rawSubRatings.reception * tierScale))),
    consistency: Math.max(1, Math.min(99, Math.round(rawSubRatings.consistency * tierScale))),
  };

  return {
    overall,
    subRatings,
    aggregatedStats,
    isProvisional,
    gamesPlayed,
  };
}

/**
 * Get game-by-game stat lines
 */
export function getGameStatLines(statEntries: StatEntryWithEvent[]): GameStatLine[] {
  return statEntries.map(stat => {
    const killPercentage = stat.attack_attempts > 0
      ? (stat.kills - stat.attack_errors) / stat.attack_attempts
      : 0;

    const servePercentage = stat.serve_attempts > 0
      ? (stat.serve_attempts - stat.service_errors) / stat.serve_attempts
      : 0;

    const passRating = stat.pass_attempts > 0
      ? stat.pass_sum / stat.pass_attempts
      : 0;

    const setRating = (stat.set_attempts || 0) > 0
      ? (stat.set_sum || 0) / (stat.set_attempts || 1)
      : 0;

    const totalBlocks = stat.block_solos + stat.block_assists * 0.5;

    return {
      ...stat,
      event: {
        id: stat.event.id,
        title: stat.event.title,
        start_time: stat.event.start_time,
        opponent: stat.event.opponent,
        opponent_tier: stat.event.opponent_tier,
      },
      killPercentage,
      servePercentage,
      passRating,
      setRating,
      totalBlocks,
    };
  });
}

/**
 * Get attendance statistics for a player
 */
export async function getAttendanceStats(
  playerId: string,
  teamId?: string
): Promise<AttendanceStats> {
  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      event:events(
        id,
        start_time,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .order('event.start_time', { ascending: true });

  if (teamId) {
    query = query.eq('event.team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }

  const records = data || [];
  const totalEvents = records.length;

  if (totalEvents === 0) {
    return {
      totalEvents: 0,
      attended: 0,
      absent: 0,
      late: 0,
      excused: 0,
      notSelected: 0,
      attendanceRate: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const attended = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const notSelected = records.filter(r => r.status === 'not_selected').length;

  const attendanceRate = totalEvents > 0 ? attended / totalEvents : 0;

  // Calculate streaks (counting present and late as attended)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = records.length - 1; i >= 0; i--) {
    const isAttended = records[i].status === 'present' || records[i].status === 'late';
    if (isAttended) {
      tempStreak++;
      if (i === records.length - 1 || currentStreak > 0) {
        currentStreak = tempStreak;
      }
    } else if (records[i].status === 'absent') {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
      if (i === records.length - 1) {
        currentStreak = 0;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    totalEvents,
    attended,
    absent,
    late,
    excused,
    notSelected,
    attendanceRate,
    currentStreak,
    longestStreak,
  };
}

/**
 * Get event type breakdown for attendance
 */
export async function getEventTypeBreakdown(
  playerId: string,
  teamId?: string
): Promise<EventTypeBreakdown> {
  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      event:events(
        type,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .in('status', ['present', 'late']);

  if (teamId) {
    query = query.eq('event.team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching event breakdown:', error);
    throw error;
  }

  const records = data || [];

  return {
    practice: records.filter((r: any) => r.event.type === 'practice').length,
    game: records.filter((r: any) => r.event.type === 'game').length,
    tournament: records.filter((r: any) => r.event.type === 'tournament').length,
    other: records.filter((r: any) => !['practice', 'game', 'tournament'].includes(r.event.type)).length,
  };
}

/**
 * Get missed events timeline (for heatmap)
 */
export async function getMissedEventsTimeline(
  playerId: string,
  teamId?: string
): Promise<MissedEvent[]> {
  let query = supabase
    .from('attendance_records')
    .select(`
      status,
      event:events(
        start_time,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .order('event.start_time', { ascending: true });

  if (teamId) {
    query = query.eq('event.team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching missed events:', error);
    throw error;
  }

  return (data || []).map((record: any) => ({
    date: record.event.start_time.split('T')[0],
    status: record.status,
  }));
}

/**
 * Get drill participation by skill tag
 */
export async function getDrillParticipation(
  playerId: string,
  teamId?: string
): Promise<DrillParticipation[]> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select(`
      *,
      drill:drills(
        skill_tags,
        progression_level
      ),
      event:events(
        team_id
      )
    `)
    .eq('team_id', teamId || '')
    .order('executed_at', { ascending: true });

  if (error) {
    console.error('Error fetching drill participation:', error);
    throw error;
  }

  const executions = data || [];

  // Group by skill tag
  const skillMap: Record<string, { count: number; minutes: number; levels: number[] }> = {};

  executions.forEach((exec: any) => {
    const skillTags = exec.drill?.skill_tags || [];
    const level = exec.drill?.progression_level || 1;
    const minutes = exec.duration_minutes;

    skillTags.forEach((tag: string) => {
      if (!skillMap[tag]) {
        skillMap[tag] = { count: 0, minutes: 0, levels: [] };
      }
      skillMap[tag].count++;
      skillMap[tag].minutes += minutes;
      skillMap[tag].levels.push(level);
    });
  });

  return Object.entries(skillMap).map(([skillTag, data]) => ({
    skillTag,
    drillCount: data.count,
    totalMinutes: data.minutes,
    avgProgressionLevel: data.levels.reduce((a, b) => a + b, 0) / data.levels.length,
  }));
}

/**
 * Get skill progression over time
 */
export async function getSkillProgression(
  playerId: string,
  teamId?: string
): Promise<SkillProgressionPoint[]> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select(`
      executed_at,
      drill:drills(
        skill_tags,
        progression_level
      ),
      event:events(
        team_id
      )
    `)
    .eq('team_id', teamId || '')
    .order('executed_at', { ascending: true });

  if (error) {
    console.error('Error fetching skill progression:', error);
    throw error;
  }

  const executions = data || [];

  // Group by month and skill tag
  const monthlySkills: Record<string, Record<string, number[]>> = {};

  executions.forEach((exec: any) => {
    const month = exec.executed_at.substring(0, 7); // YYYY-MM
    const skillTags = exec.drill?.skill_tags || [];
    const level = exec.drill?.progression_level || 1;

    if (!monthlySkills[month]) {
      monthlySkills[month] = {};
    }

    skillTags.forEach((tag: string) => {
      if (!monthlySkills[month][tag]) {
        monthlySkills[month][tag] = [];
      }
      monthlySkills[month][tag].push(level);
    });
  });

  const points: SkillProgressionPoint[] = [];

  Object.entries(monthlySkills).forEach(([month, skills]) => {
    Object.entries(skills).forEach(([skillTag, levels]) => {
      points.push({
        date: month,
        skillTag,
        avgLevel: levels.reduce((a, b) => a + b, 0) / levels.length,
      });
    });
  });

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get training volume by month (for stacked area chart)
 */
export async function getTrainingVolume(
  playerId: string,
  teamId?: string
): Promise<TrainingVolumePoint[]> {
  const { data, error } = await supabase
    .from('drill_executions')
    .select(`
      executed_at,
      duration_minutes,
      drill:drills(
        skill_tags
      ),
      event:events(
        team_id
      )
    `)
    .eq('team_id', teamId || '')
    .order('executed_at', { ascending: true });

  if (error) {
    console.error('Error fetching training volume:', error);
    throw error;
  }

  const executions = data || [];

  // Group by month and skill tag
  const monthlyVolume: Record<string, Record<string, number>> = {};

  executions.forEach((exec: any) => {
    const month = exec.executed_at.substring(0, 7); // YYYY-MM
    const skillTags = exec.drill?.skill_tags || [];
    const minutes = exec.duration_minutes;

    if (!monthlyVolume[month]) {
      monthlyVolume[month] = {};
    }

    skillTags.forEach((tag: string) => {
      if (!monthlyVolume[month][tag]) {
        monthlyVolume[month][tag] = 0;
      }
      monthlyVolume[month][tag] += minutes;
    });
  });

  return Object.entries(monthlyVolume).map(([month, skills]) => ({
    month,
    ...skills,
  }));
}

/**
 * Create a new stat entry
 */
export async function createStatEntry(
  entry: Omit<StatEntry, 'id' | 'recorded_at' | 'updated_at'>
): Promise<StatEntry> {
  const { data, error } = await supabase
    .from('stat_entries')
    .insert({
      player_id: entry.player_id,
      event_id: entry.event_id,
      kills: entry.kills,
      attack_errors: entry.attack_errors,
      attack_attempts: entry.attack_attempts,
      aces: entry.aces,
      service_errors: entry.service_errors,
      serve_attempts: entry.serve_attempts,
      digs: entry.digs,
      block_solos: entry.block_solos,
      block_assists: entry.block_assists,
      block_touches: entry.block_touches,
      set_attempts: entry.set_attempts,
      set_sum: entry.set_sum,
      setting_errors: entry.setting_errors,
      ball_handling_errors: entry.ball_handling_errors,
      pass_attempts: entry.pass_attempts,
      pass_sum: entry.pass_sum,
      pass_ratings_by_zone: entry.pass_ratings_by_zone,
      rotation: entry.rotation,
      sets_played: entry.sets_played,
      rotations_played: entry.rotations_played,
      recorded_by: entry.recorded_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating stat entry:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing stat entry
 */
export async function updateStatEntry(
  id: string,
  updates: Partial<Omit<StatEntry, 'id' | 'player_id' | 'event_id' | 'recorded_at' | 'updated_at' | 'recorded_by'>>
): Promise<StatEntry> {
  const { data, error } = await supabase
    .from('stat_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating stat entry:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a stat entry
 */
export async function deleteStatEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('stat_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting stat entry:', error);
    throw error;
  }
}

/**
 * Get all stat entries for an event
 */
export async function getStatEntriesForEvent(eventId: string): Promise<StatEntry[]> {
  const { data, error } = await supabase
    .from('stat_entries')
    .select('*')
    .eq('event_id', eventId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Error fetching stat entries for event:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get player form based on attendance at the last 10 practices.
 * Max form is reached at 8/10 practices attended.
 * Returns a 1-99 scale rating.
 */
export async function getPlayerForm(
  playerId: string,
  teamId?: string
): Promise<PlayerForm> {
  let query = supabase
    .from('attendance_records')
    .select(`
      status,
      event:events!inner(
        id,
        type,
        start_time,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .eq('event.type', 'practice')
    .order('event.start_time', { ascending: false })
    .limit(10);

  if (teamId) {
    query = query.eq('event.team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching player form:', error);
    throw error;
  }

  const records = data || [];
  const practicesTotal = Math.min(records.length, 10);
  const practicesAttended = records.filter(
    (r: any) => r.status === 'present' || r.status === 'late'
  ).length;

  // Map attendance to 1-99: 8/10 = 99, scale linearly, minimum 1
  const maxAttendance = Math.min(practicesTotal, 8);
  const formRating = practicesTotal === 0
    ? 1
    : Math.max(1, Math.min(99, Math.round((Math.min(practicesAttended, 8) / 8) * 99)));

  return {
    practicesAttended,
    practicesTotal,
    formRating,
  };
}

/**
 * Get per-rotation performance breakdown.
 * Only returns data for rotations that have stat entries with the rotation field set.
 */
export function getRotationStats(statEntries: StatEntryWithEvent[]): RotationStats[] {
  const entriesWithRotation = statEntries.filter(e => e.rotation != null);
  if (entriesWithRotation.length === 0) return [];

  // Overall averages for comparison
  const overallAgg = aggregateStats(entriesWithRotation);
  const overallKillPct = overallAgg.killPercentage;
  const overallPassRating = overallAgg.passRating;
  const overallDigsPerGame = overallAgg.digsPerGame;

  const rotationMap = new Map<number, StatEntryWithEvent[]>();
  for (const entry of entriesWithRotation) {
    const r = entry.rotation!;
    if (!rotationMap.has(r)) rotationMap.set(r, []);
    rotationMap.get(r)!.push(entry);
  }

  const results: RotationStats[] = [];
  for (let r = 1; r <= 6; r++) {
    const entries = rotationMap.get(r);
    if (!entries || entries.length === 0) continue;

    const agg = aggregateStats(entries);
    const isBelowAverage =
      agg.killPercentage < overallKillPct ||
      agg.passRating < overallPassRating ||
      agg.digsPerGame < overallDigsPerGame;

    results.push({
      rotation: r,
      gamesInRotation: entries.length,
      killPercentage: agg.killPercentage,
      passRating: agg.passRating,
      digs: agg.totalDigs,
      isBelowAverage,
    });
  }

  return results;
}
