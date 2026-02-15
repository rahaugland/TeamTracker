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
  serve: number;      // 1-99
  receive: number;    // 1-99
  set: number;        // 1-99
  block: number;      // 1-99
  attack: number;     // 1-99
  dig: number;        // 1-99
  mental: number;     // 1-99
  physique: number;   // 1-99
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
    sets_won?: number;
    sets_lost?: number;
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

export type TimePeriod = 'game' | 'season' | 'career' | 'custom' | 'last5' | 'last30';

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

// Position weight profiles for overall rating calculation (8 skills)
type PositionWeights = { serve: number; receive: number; set: number; block: number; attack: number; dig: number; mental: number; physique: number };
const POSITION_WEIGHTS: Record<VolleyballPosition, PositionWeights> = {
  outside_hitter:      { serve: 0.12, receive: 0.15, set: 0.05, block: 0.08, attack: 0.25, dig: 0.10, mental: 0.15, physique: 0.10 },
  opposite:            { serve: 0.12, receive: 0.08, set: 0.05, block: 0.10, attack: 0.30, dig: 0.05, mental: 0.15, physique: 0.15 },
  middle_blocker:      { serve: 0.08, receive: 0.05, set: 0.05, block: 0.25, attack: 0.22, dig: 0.05, mental: 0.15, physique: 0.15 },
  setter:              { serve: 0.10, receive: 0.15, set: 0.30, block: 0.05, attack: 0.05, dig: 0.10, mental: 0.15, physique: 0.10 },
  libero:              { serve: 0.00, receive: 0.30, set: 0.10, block: 0.00, attack: 0.00, dig: 0.30, mental: 0.20, physique: 0.10 },
  defensive_specialist:{ serve: 0.10, receive: 0.25, set: 0.08, block: 0.02, attack: 0.05, dig: 0.25, mental: 0.15, physique: 0.10 },
  all_around:          { serve: 0.12, receive: 0.12, set: 0.12, block: 0.12, attack: 0.14, dig: 0.12, mental: 0.14, physique: 0.12 },
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
  // Skip Supabase query for temp IDs (player not yet synced)
  if (playerId.startsWith('temp_')) return [];

  const query = supabase
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
        sets_won,
        sets_lost,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .order('recorded_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }

  let results = (data || []) as StatEntryWithEvent[];

  // Filter by team post-query (nested filters don't work reliably)
  if (teamId) {
    results = results.filter(r => r.event?.team_id === teamId);
  }

  // Apply filters based on period
  if (period === 'custom' && customRange) {
    results = results.filter(r => {
      const eventDate = r.event?.start_time;
      if (!eventDate) return false;
      return eventDate >= customRange.startDate && eventDate <= customRange.endDate;
    });
  }

  // For 'last5', limit to 5 results
  if (period === 'last5') {
    results = results.slice(0, 5);
  }

  // For 'last30', filter to last 30 days
  if (period === 'last30') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffISO = cutoff.toISOString();
    results = results.filter(r => {
      const eventDate = r.event?.start_time;
      return eventDate && eventDate >= cutoffISO;
    });
  }

  return results;
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
 * Calculate sub-ratings (1-99 scale) using Bayesian formulas for all 8 skill categories
 */
export function calculateSubRatings(stats: AggregatedStats): SubRatings {
  // --- Serve: aces rewarded, errors punished ---
  const effectiveAceRate = stats.totalServeAttempts > 0
    ? bayesianRate(stats.totalAces, stats.totalServeAttempts, 0.05, 15)
    : 0;
  const effectiveServeErrorRate = stats.totalServeAttempts > 0
    ? bayesianRate(stats.totalServiceErrors, stats.totalServeAttempts, 0.10, 15)
    : 0;
  const serveScore = (effectiveAceRate * 3) + (1 - effectiveServeErrorRate); // range ~0 to ~1.3
  const serve = Math.max(1, Math.min(99, Math.round(serveScore * 76)));

  // --- Receive: pass rating 0-3 scale ---
  const effectivePassRating = stats.totalPassAttempts > 0
    ? bayesianRate(stats.totalPassSum, stats.totalPassAttempts, 1.5, 10)
    : 0;
  const receive = Math.max(1, Math.min(99, Math.round(effectivePassRating * 33)));

  // --- Set: assists-based rating (set_sum represents successful sets) ---
  const effectiveSetRating = stats.totalSetAttempts > 0
    ? bayesianRate(stats.totalSetSum, stats.totalSetAttempts, 1.5, 10)
    : 0;
  const setErrorPenalty = stats.totalSetAttempts > 0
    ? bayesianRate(stats.totalSettingErrors, stats.totalSetAttempts, 0.10, 10)
    : 0;
  const setScore = (effectiveSetRating / 3) * 0.8 + (1 - setErrorPenalty) * 0.2; // 0-1 range
  const set = Math.max(1, Math.min(99, Math.round(setScore * 99)));

  // --- Block: solos worth 2x, assists 1x, scaled ---
  const totalBlockPoints = stats.totalBlockSolos * 2 + stats.totalBlockAssists;
  const blockPerGame = stats.gamesPlayed > 0 ? totalBlockPoints / stats.gamesPlayed : 0;
  // 6+ block points per game = 99
  const block = Math.max(1, Math.min(99, Math.round(Math.min(blockPerGame / 6, 1) * 99)));

  // --- Attack: kill efficiency-based ---
  const effectiveAttackEfficiency = stats.totalAttackAttempts > 0
    ? bayesianRate(stats.totalKills - stats.totalAttackErrors, stats.totalAttackAttempts, 0.30, 15)
    : 0;
  const attack = Math.max(1, Math.min(99, Math.round(effectiveAttackEfficiency * 165)));

  // --- Dig: digs per game based ---
  const digsPerGame = stats.gamesPlayed > 0 ? stats.totalDigs / stats.gamesPlayed : 0;
  // 15+ digs per game = 99
  const dig = Math.max(1, Math.min(99, Math.round(Math.min(digsPerGame / 15, 1) * 99)));

  // --- Mental: low error rate = high rating ---
  const totalErrors = stats.totalAttackErrors + stats.totalServiceErrors + stats.totalBallHandlingErrors;
  const totalActions = stats.totalAttackAttempts + stats.totalServeAttempts + stats.totalPassAttempts;
  const effectiveErrorRate = totalActions > 0
    ? bayesianRate(totalErrors, totalActions, 0.15, 20)
    : 0.15;
  const mentalRaw = Math.pow(Math.max(0, 1 - effectiveErrorRate / 0.30), 1.2) * 99;
  const mental = Math.max(1, Math.min(99, Math.round(mentalRaw)));

  // --- Physique: attendance-based if available, otherwise derived from power stats ---
  // Since we don't have attendance data in aggregated stats, derive from endurance indicators
  // High serve attempts + attack attempts per game indicates physical endurance
  const actionsPerGame = stats.gamesPlayed > 0
    ? (stats.totalServeAttempts + stats.totalAttackAttempts + stats.totalDigs) / stats.gamesPlayed
    : 0;
  // 30+ actions per game = 99, with floor at 50 (baseline fitness)
  const physiqueRaw = Math.min(actionsPerGame / 30, 1) * 49 + 50;
  const physique = stats.gamesPlayed > 0
    ? Math.max(1, Math.min(99, Math.round(physiqueRaw)))
    : 70; // Default to 70 if no data

  return { serve, receive, set, block, attack, dig, mental, physique };
}

/**
 * Calculate 8 skill values as unrounded floats for a set of stat entries.
 * Uses the same tier-scaling pipeline as calculatePlayerRating but skips rounding,
 * so cumulative comparisons can detect sub-integer changes.
 */
export function calculateRawSkillValues(
  statEntries: StatEntryWithEvent[]
): Record<string, number> {
  if (statEntries.length === 0) {
    return { serve: 0, receive: 0, set: 0, block: 0, attack: 0, dig: 0, mental: 0, physique: 0 };
  }

  const agg = aggregateStats(statEntries);

  // Raw sub-ratings WITHOUT rounding (mirrors calculateSubRatings logic)
  // Serve
  const effectiveAceRate = agg.totalServeAttempts > 0
    ? bayesianRate(agg.totalAces, agg.totalServeAttempts, 0.05, 15)
    : 0;
  const effectiveServeErrorRate = agg.totalServeAttempts > 0
    ? bayesianRate(agg.totalServiceErrors, agg.totalServeAttempts, 0.10, 15)
    : 0;
  const serveRaw = Math.max(1, Math.min(99, ((effectiveAceRate * 3) + (1 - effectiveServeErrorRate)) * 76));

  // Receive
  const effectivePassRating = agg.totalPassAttempts > 0
    ? bayesianRate(agg.totalPassSum, agg.totalPassAttempts, 1.5, 10)
    : 0;
  const receiveRaw = Math.max(1, Math.min(99, effectivePassRating * 33));

  // Set
  const effectiveSetRating = agg.totalSetAttempts > 0
    ? bayesianRate(agg.totalSetSum, agg.totalSetAttempts, 1.5, 10)
    : 0;
  const setErrorPenalty = agg.totalSetAttempts > 0
    ? bayesianRate(agg.totalSettingErrors, agg.totalSetAttempts, 0.10, 10)
    : 0;
  const setRaw = Math.max(1, Math.min(99, ((effectiveSetRating / 3) * 0.8 + (1 - setErrorPenalty) * 0.2) * 99));

  // Block
  const totalBlockPoints = agg.totalBlockSolos * 2 + agg.totalBlockAssists;
  const blockPerGame = agg.gamesPlayed > 0 ? totalBlockPoints / agg.gamesPlayed : 0;
  const blockRaw = Math.max(1, Math.min(99, Math.min(blockPerGame / 6, 1) * 99));

  // Attack
  const effectiveAttackEfficiency = agg.totalAttackAttempts > 0
    ? bayesianRate(agg.totalKills - agg.totalAttackErrors, agg.totalAttackAttempts, 0.30, 15)
    : 0;
  const attackRaw = Math.max(1, Math.min(99, effectiveAttackEfficiency * 165));

  // Dig
  const digsPerGame = agg.gamesPlayed > 0 ? agg.totalDigs / agg.gamesPlayed : 0;
  const digRaw = Math.max(1, Math.min(99, Math.min(digsPerGame / 15, 1) * 99));

  // Mental
  const totalErrors = agg.totalAttackErrors + agg.totalServiceErrors + agg.totalBallHandlingErrors;
  const totalActions = agg.totalAttackAttempts + agg.totalServeAttempts + agg.totalPassAttempts;
  const effectiveErrorRate = totalActions > 0
    ? bayesianRate(totalErrors, totalActions, 0.15, 20)
    : 0.15;
  const mentalRaw = Math.max(1, Math.min(99, Math.pow(Math.max(0, 1 - effectiveErrorRate / 0.30), 1.2) * 99));

  // Physique
  const actionsPerGame = agg.gamesPlayed > 0
    ? (agg.totalServeAttempts + agg.totalAttackAttempts + agg.totalDigs) / agg.gamesPlayed
    : 0;
  const physiqueRaw = agg.gamesPlayed > 0
    ? Math.max(1, Math.min(99, Math.min(actionsPerGame / 30, 1) * 49 + 50))
    : 70;

  // Tier scaling (mirrors calculatePlayerRating logic)
  let tierWeightSum = 0;
  let tierWeightedMax = 0;
  statEntries.forEach(game => {
    const opponentTier = game.event.opponent_tier || 5;
    const opponentMax = TIER_MAX_RATING[opponentTier] || 55;
    const recencyWeight = getRecencyWeight(game.event.start_time);
    tierWeightSum += recencyWeight;
    tierWeightedMax += opponentMax * recencyWeight;
  });
  const avgOpponentMax = tierWeightedMax / tierWeightSum;
  const tierScale = avgOpponentMax / 99;

  return {
    serve: serveRaw * tierScale,
    receive: receiveRaw * tierScale,
    set: setRaw * tierScale,
    block: blockRaw * tierScale,
    attack: attackRaw * tierScale,
    dig: digRaw * tierScale,
    mental: mentalRaw * tierScale,
    physique: physiqueRaw * tierScale,
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

    // Calculate weighted performance score (1-99) using 8 skill weights
    const performanceScore =
      gameSubRatings.serve * weights.serve +
      gameSubRatings.receive * weights.receive +
      gameSubRatings.set * weights.set +
      gameSubRatings.block * weights.block +
      gameSubRatings.attack * weights.attack +
      gameSubRatings.dig * weights.dig +
      gameSubRatings.mental * weights.mental +
      gameSubRatings.physique * weights.physique;

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
    serve: Math.max(1, Math.min(99, Math.round(rawSubRatings.serve * tierScale))),
    receive: Math.max(1, Math.min(99, Math.round(rawSubRatings.receive * tierScale))),
    set: Math.max(1, Math.min(99, Math.round(rawSubRatings.set * tierScale))),
    block: Math.max(1, Math.min(99, Math.round(rawSubRatings.block * tierScale))),
    attack: Math.max(1, Math.min(99, Math.round(rawSubRatings.attack * tierScale))),
    dig: Math.max(1, Math.min(99, Math.round(rawSubRatings.dig * tierScale))),
    mental: Math.max(1, Math.min(99, Math.round(rawSubRatings.mental * tierScale))),
    physique: Math.max(1, Math.min(99, Math.round(rawSubRatings.physique * tierScale))),
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
 * Calculate a per-game performance rating (1-99 scale) for a single game.
 * Uses position-weighted sub-ratings scaled by opponent tier ceiling.
 */
export function calculateSingleGameRating(
  stat: StatEntry,
  opponentTier: number,
  position: VolleyballPosition
): number {
  const fakeEntry = { ...stat, event: { start_time: new Date().toISOString() } } as unknown as StatEntryWithEvent;
  const gameAgg = aggregateStats([fakeEntry]);
  const gameSubRatings = calculateSubRatings(gameAgg);

  const weights = POSITION_WEIGHTS[position];
  const performanceScore =
    gameSubRatings.serve * weights.serve +
    gameSubRatings.receive * weights.receive +
    gameSubRatings.set * weights.set +
    gameSubRatings.block * weights.block +
    gameSubRatings.attack * weights.attack +
    gameSubRatings.dig * weights.dig +
    gameSubRatings.mental * weights.mental +
    gameSubRatings.physique * weights.physique;

  const opponentMax = TIER_MAX_RATING[opponentTier] || 55;
  const gameRating = opponentMax * (performanceScore / 99);

  return Math.max(1, Math.min(99, Math.round(gameRating)));
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
        sets_won: stat.event.sets_won,
        sets_lost: stat.event.sets_lost,
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
    .order('created_at', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }

  // Filter by team post-query (nested filters don't work reliably)
  let records = (data || []) as Array<AttendanceRecord & { event: { id: string; start_time: string; team_id: string } }>;
  if (teamId) {
    records = records.filter(r => r.event?.team_id === teamId);
  }
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

  const statusCounts = { present: 0, absent: 0, late: 0, excused: 0, not_selected: 0 };
  for (const r of records) {
    if (r.status in statusCounts) statusCounts[r.status as keyof typeof statusCounts]++;
  }
  const attended = statusCounts.present;
  const absent = statusCounts.absent;
  const late = statusCounts.late;
  const excused = statusCounts.excused;
  const notSelected = statusCounts.not_selected;

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
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching event breakdown:', error);
    throw error;
  }

  // Filter by team post-query
  let records = (data || []) as Array<{ event: { type: string; team_id: string } }>;
  if (teamId) {
    records = records.filter(r => r.event?.team_id === teamId);
  }

  const breakdown = { practice: 0, game: 0, tournament: 0, other: 0 };
  for (const r of records) {
    const type = r.event?.type;
    if (type === 'practice') breakdown.practice++;
    else if (type === 'game') breakdown.game++;
    else if (type === 'tournament') breakdown.tournament++;
    else if (type) breakdown.other++;
  }

  return breakdown;
}

/**
 * Get missed events timeline (for heatmap)
 */
export async function getMissedEventsTimeline(
  playerId: string,
  teamId?: string
): Promise<MissedEvent[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      status,
      event:events(
        start_time,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching missed events:', error);
    throw error;
  }

  // Filter by team post-query
  // Supabase returns event as object, not array
  type MissedEventRecord = { status: AttendanceStatus; event: { start_time: string; team_id: string } | null };
  let records = (data || []) as unknown as MissedEventRecord[];
  if (teamId) {
    records = records.filter(r => r.event?.team_id === teamId);
  }

  return records
    .filter(r => r.event?.start_time)
    .map(record => ({
      date: record.event!.start_time.split('T')[0],
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
  let query = supabase
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
    .order('executed_at', { ascending: true });

  // Only filter by team if teamId is provided
  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;

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
 * Derives skill levels from game stats using the same calculation as the FIFA card
 * Uses 1-99 scale matching the SkillRatingsPanel and FIFA card
 * Applies opponent tier scaling to match FIFA card values
 */
export async function getSkillProgression(
  playerId: string,
  teamId?: string
): Promise<SkillProgressionPoint[]> {
  // Get player's game stats over time
  const stats = await getPlayerStats(playerId, 'career', undefined, teamId);

  if (stats.length === 0) {
    return [];
  }

  // Group stats by month
  const monthlyStats: Record<string, StatEntryWithEvent[]> = {};

  stats.forEach(stat => {
    const month = stat.event.start_time.substring(0, 7); // YYYY-MM
    if (!monthlyStats[month]) {
      monthlyStats[month] = [];
    }
    monthlyStats[month].push(stat);
  });

  const points: SkillProgressionPoint[] = [];

  // Sort stats chronologically so we can build cumulative sets
  const sortedStats = [...stats].sort(
    (a, b) => a.event.start_time.localeCompare(b.event.start_time)
  );

  // Get ordered list of months
  const months = Object.keys(monthlyStats).sort();

  // For each month, calculate cumulative player rating (all games up to and including that month)
  // This matches the player rating approach, not per-match performance
  let cumulativeStats: StatEntryWithEvent[] = [];

  for (const month of months) {
    cumulativeStats = cumulativeStats.concat(monthlyStats[month]);

    const agg = aggregateStats(cumulativeStats);
    const rawSubRatings = calculateSubRatings(agg);

    // Calculate opponent tier scale from all cumulative games (same as calculatePlayerRating)
    let tierWeightSum = 0;
    let tierWeightedMax = 0;
    cumulativeStats.forEach(game => {
      const opponentTier = game.event.opponent_tier || 5;
      const opponentMax = TIER_MAX_RATING[opponentTier] || 55;
      const recencyWeight = getRecencyWeight(game.event.start_time);
      tierWeightSum += recencyWeight;
      tierWeightedMax += opponentMax * recencyWeight;
    });

    // Apply tier scaling to match FIFA card values
    const avgOpponentMax = tierWeightSum > 0 ? tierWeightedMax / tierWeightSum : 55;
    const tierScale = avgOpponentMax / 99;

    // Scale all 8 raw ratings
    const skillKeys = ['serve', 'receive', 'set', 'block', 'attack', 'dig', 'mental', 'physique'] as const;
    for (const key of skillKeys) {
      const scaled = Math.max(1, Math.min(99, Math.round(rawSubRatings[key] * tierScale)));
      points.push({ date: month, skillTag: key, avgLevel: scaled });
    }
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get training volume by month (for stacked area chart)
 */
export async function getTrainingVolume(
  playerId: string,
  teamId?: string
): Promise<TrainingVolumePoint[]> {
  let query = supabase
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
    .order('executed_at', { ascending: true });

  // Only filter by team if teamId is provided
  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;

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
  // First, get practice events
  let eventsQuery = supabase
    .from('events')
    .select('id, start_time, team_id')
    .eq('type', 'practice')
    .order('start_time', { ascending: false });

  if (teamId) {
    eventsQuery = eventsQuery.eq('team_id', teamId);
  }

  const { data: events, error: eventsError } = await eventsQuery;

  if (eventsError) {
    console.error('Error fetching practice events:', eventsError);
    throw eventsError;
  }

  const practiceEventIds = (events || []).slice(0, 10).map(e => e.id);

  if (practiceEventIds.length === 0) {
    return {
      practicesAttended: 0,
      practicesTotal: 0,
      formRating: 1,
    };
  }

  // Get attendance for these practice events
  const { data, error } = await supabase
    .from('attendance_records')
    .select('status, event_id')
    .eq('player_id', playerId)
    .in('event_id', practiceEventIds);

  if (error) {
    console.error('Error fetching player form:', error);
    throw error;
  }

  const records = data || [];
  const practicesTotal = practiceEventIds.length;
  const practicesAttended = records.filter(
    (r: { status: string }) => r.status === 'present' || r.status === 'late'
  ).length;

  // Map attendance to 1-99: 8/10 = 99, scale linearly, minimum 1
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

/**
 * Stats for player selection in match roster
 */
export interface PlayerSelectionStats {
  attendancePercent: number;
  keyStat: { label: string; value: number };
  form: 'good' | 'average' | 'poor';
}

/**
 * Get player selection stats for roster display
 * Returns attendance percentage, key stat based on position, and form indicator
 */
export async function getPlayerSelectionStats(
  playerId: string,
  teamId: string,
  position?: VolleyballPosition
): Promise<PlayerSelectionStats> {
  // Get attendance stats
  const attendanceStats = await getAttendanceStats(playerId, teamId);
  const attendancePercent = Math.round(attendanceStats.attendanceRate * 100);

  // Get last 5 games (only need 3, but last5 is most efficient period)
  const recentStats = await getPlayerStats(playerId, 'last5', undefined, teamId);
  const last3Games = recentStats.slice(0, 3);
  const aggregated = aggregateStats(last3Games);

  // Determine key stat based on position
  let keyStat: { label: string; value: number };
  let form: 'good' | 'average' | 'poor' = 'average';

  // Calculate form based on position
  switch (position) {
    case 'outside_hitter':
    case 'opposite':
      // Key stat: kills
      keyStat = { label: 'kills', value: aggregated.totalKills };
      // Form: based on kill efficiency
      if (last3Games.length === 0) {
        form = 'average';
      } else if (aggregated.killPercentage > 0.25) {
        form = 'good';
      } else if (aggregated.killPercentage >= 0.15) {
        form = 'average';
      } else {
        form = 'poor';
      }
      break;

    case 'middle_blocker':
      // Key stat: blocks
      keyStat = { label: 'blocks', value: aggregated.totalBlockSolos + aggregated.totalBlockAssists };
      // Form: based on kill efficiency (MBs also attack)
      if (last3Games.length === 0) {
        form = 'average';
      } else if (aggregated.killPercentage > 0.25) {
        form = 'good';
      } else if (aggregated.killPercentage >= 0.15) {
        form = 'average';
      } else {
        form = 'poor';
      }
      break;

    case 'setter':
      // Key stat: assists (using set_sum as proxy for assists)
      keyStat = { label: 'assists', value: aggregated.totalSetSum };
      // Form: based on assist-to-error ratio
      const assistErrors = aggregated.totalSettingErrors || 1;
      const assistRatio = aggregated.totalSetSum / assistErrors;
      if (last3Games.length === 0) {
        form = 'average';
      } else if (assistRatio > 10) {
        form = 'good';
      } else if (assistRatio >= 5) {
        form = 'average';
      } else {
        form = 'poor';
      }
      break;

    case 'libero':
    case 'defensive_specialist':
      // Key stat: digs
      keyStat = { label: 'digs', value: aggregated.totalDigs };
      // Form: based on dig average per game
      if (last3Games.length === 0) {
        form = 'average';
      } else if (aggregated.digsPerGame > 10) {
        form = 'good';
      } else if (aggregated.digsPerGame >= 5) {
        form = 'average';
      } else {
        form = 'poor';
      }
      break;

    case 'all_around':
    default:
      // Key stat: kills for all-around players
      keyStat = { label: 'kills', value: aggregated.totalKills };
      // Form: based on attendance if no specific position
      if (attendancePercent >= 80) {
        form = 'good';
      } else if (attendancePercent >= 50) {
        form = 'average';
      } else {
        form = 'poor';
      }
      break;
  }

  return {
    attendancePercent,
    keyStat,
    form,
  };
}

/**
 * Get selection stats for multiple players at once (batch operation)
 * More efficient than calling getPlayerSelectionStats individually
 */
export async function getBatchPlayerSelectionStats(
  players: Array<{ id: string; position?: VolleyballPosition }>,
  teamId: string
): Promise<Map<string, PlayerSelectionStats>> {
  const results = new Map<string, PlayerSelectionStats>();

  // Process in parallel for better performance
  await Promise.all(
    players.map(async (player) => {
      try {
        const stats = await getPlayerSelectionStats(player.id, teamId, player.position);
        results.set(player.id, stats);
      } catch (error) {
        console.error(`Error fetching selection stats for player ${player.id}:`, error);
        // Provide default stats on error
        results.set(player.id, {
          attendancePercent: 0,
          keyStat: { label: 'kills', value: 0 },
          form: 'average',
        });
      }
    })
  );

  return results;
}
