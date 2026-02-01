import { supabase } from '@/lib/supabase';
import type { TeamSeason, SeasonAward, SeasonAwardType, StatEntry } from '@/types/database.types';

export interface CreateTeamSeasonInput {
  team_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_by: string;
}

/**
 * Get all team seasons for a team
 */
export async function getTeamSeasons(teamId: string): Promise<TeamSeason[]> {
  const { data, error } = await supabase
    .from('team_seasons')
    .select('*')
    .eq('team_id', teamId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching team seasons:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get a single team season
 */
export async function getTeamSeason(id: string): Promise<TeamSeason | null> {
  const { data, error } = await supabase
    .from('team_seasons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching team season:', error);
    throw error;
  }
  return data;
}

/**
 * Create a team season
 */
export async function createTeamSeason(input: CreateTeamSeasonInput): Promise<TeamSeason> {
  const { data, error } = await supabase
    .from('team_seasons')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating team season:', error);
    throw error;
  }
  return data;
}

/**
 * Delete a team season
 */
export async function deleteTeamSeason(id: string): Promise<void> {
  const { error } = await supabase.from('team_seasons').delete().eq('id', id);
  if (error) {
    console.error('Error deleting team season:', error);
    throw error;
  }
}

/**
 * Get season awards
 */
export async function getSeasonAwards(seasonId: string): Promise<SeasonAward[]> {
  const { data, error } = await supabase
    .from('season_awards')
    .select('*')
    .eq('season_id', seasonId)
    .order('award_type');

  if (error) {
    console.error('Error fetching season awards:', error);
    throw error;
  }
  return data || [];
}

export interface SeasonSummaryMatch {
  eventId: string;
  opponent: string | null;
  setsWon: number;
  setsLost: number;
  won: boolean;
}

export interface SeasonSummaryData {
  wins: number;
  losses: number;
  aggregatedStats: { killPct: number | null; servePct: number | null };
  avgAttendanceRate: number;
  recentMatches: SeasonSummaryMatch[];
}

/**
 * Get a summary of season performance: W/L record, team stats, attendance, recent matches
 */
export async function getSeasonSummary(teamId: string, startDate: string, endDate: string): Promise<SeasonSummaryData> {
  // Get game/tournament events in date range with scores
  const { data: gameEvents } = await supabase
    .from('events')
    .select('id, opponent, sets_won, sets_lost, is_finalized, start_time')
    .eq('team_id', teamId)
    .in('type', ['game', 'tournament'])
    .gte('start_time', startDate)
    .lte('start_time', endDate + 'T23:59:59Z')
    .order('start_time', { ascending: false });

  const matches = (gameEvents || []).filter((e: any) => e.sets_won != null && e.sets_lost != null);
  let wins = 0;
  let losses = 0;
  const recentMatches: SeasonSummaryMatch[] = [];

  for (const m of matches) {
    const won = m.sets_won > m.sets_lost;
    if (won) wins++; else losses++;
    recentMatches.push({
      eventId: m.id,
      opponent: m.opponent,
      setsWon: m.sets_won,
      setsLost: m.sets_lost,
      won,
    });
  }

  // Get finalized game stat entries for aggregated team stats
  const finalizedIds = (gameEvents || []).filter((e: any) => e.is_finalized).map((e: any) => e.id);
  let killPct: number | null = null;
  let servePct: number | null = null;

  if (finalizedIds.length > 0) {
    const { data: stats } = await supabase
      .from('stat_entries')
      .select('kills, attack_errors, attack_attempts, aces, service_errors, serve_attempts')
      .in('event_id', finalizedIds);

    if (stats && stats.length > 0) {
      let totalKills = 0, totalAtkErr = 0, totalAtkAtt = 0;
      let totalAces = 0, totalSrvErr = 0, totalSrvAtt = 0;
      for (const s of stats) {
        totalKills += s.kills;
        totalAtkErr += s.attack_errors;
        totalAtkAtt += s.attack_attempts;
        totalAces += s.aces;
        totalSrvErr += s.service_errors;
        totalSrvAtt += s.serve_attempts;
      }
      if (totalAtkAtt > 0) killPct = ((totalKills - totalAtkErr) / totalAtkAtt) * 100;
      if (totalSrvAtt > 0) servePct = ((totalAces) / totalSrvAtt) * 100;
    }
  }

  // Get attendance for all events in range
  const { data: allEvents } = await supabase
    .from('events')
    .select('id')
    .eq('team_id', teamId)
    .gte('start_time', startDate)
    .lte('start_time', endDate + 'T23:59:59Z');

  let avgAttendanceRate = 0;
  const allEventIds = (allEvents || []).map((e: any) => e.id);
  if (allEventIds.length > 0) {
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('status')
      .in('event_id', allEventIds);

    if (attendance && attendance.length > 0) {
      const present = attendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      avgAttendanceRate = (present / attendance.length) * 100;
    }
  }

  return { wins, losses, aggregatedStats: { killPct, servePct }, avgAttendanceRate, recentMatches: recentMatches.slice(0, 10) };
}

interface SeasonStatData {
  statEntries: (StatEntry & { event_start: string })[];
  attendanceByPlayer: Record<string, { total: number; attended: number; practices: number }>;
  playerIds: string[];
}

/**
 * Fetch all data needed for season award calculation
 */
async function fetchSeasonData(teamId: string, startDate: string, endDate: string): Promise<SeasonStatData> {
  // Get finalized game events in date range
  const { data: events, error: evErr } = await supabase
    .from('events')
    .select('id, start_time, type')
    .eq('team_id', teamId)
    .gte('start_time', startDate)
    .lte('start_time', endDate + 'T23:59:59Z');

  if (evErr) throw evErr;

  const allEvents = events || [];
  const finalizedGameIds: string[] = [];

  // Get finalized game IDs
  const { data: finalizedEvents } = await supabase
    .from('events')
    .select('id, start_time')
    .eq('team_id', teamId)
    .eq('is_finalized', true)
    .in('type', ['game', 'tournament'])
    .gte('start_time', startDate)
    .lte('start_time', endDate + 'T23:59:59Z');

  for (const ev of finalizedEvents || []) {
    finalizedGameIds.push(ev.id);
  }

  // Get stat entries for finalized games
  let statEntries: (StatEntry & { event_start: string })[] = [];
  if (finalizedGameIds.length > 0) {
    const { data: stats } = await supabase
      .from('stat_entries')
      .select('*')
      .in('event_id', finalizedGameIds);

    const eventDateMap: Record<string, string> = {};
    for (const ev of finalizedEvents || []) {
      eventDateMap[ev.id] = ev.start_time;
    }

    statEntries = (stats || []).map((s) => ({
      ...s,
      event_start: eventDateMap[s.event_id] || '',
    }));
  }

  // Get attendance records for all events in range
  const eventIds = allEvents.map((e) => e.id);
  const attendanceByPlayer: Record<string, { total: number; attended: number; practices: number }> = {};

  if (eventIds.length > 0) {
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('player_id, status, event_id')
      .in('event_id', eventIds);

    const eventTypeMap: Record<string, string> = {};
    for (const ev of allEvents) {
      eventTypeMap[ev.id] = ev.type;
    }

    for (const rec of attendance || []) {
      if (!attendanceByPlayer[rec.player_id]) {
        attendanceByPlayer[rec.player_id] = { total: 0, attended: 0, practices: 0 };
      }
      attendanceByPlayer[rec.player_id].total++;
      if (rec.status === 'present' || rec.status === 'late') {
        attendanceByPlayer[rec.player_id].attended++;
        if (eventTypeMap[rec.event_id] === 'practice') {
          attendanceByPlayer[rec.player_id].practices++;
        }
      }
    }
  }

  const playerIds = [...new Set([
    ...statEntries.map((s) => s.player_id),
    ...Object.keys(attendanceByPlayer),
  ])];

  return { statEntries, attendanceByPlayer, playerIds };
}

/**
 * Calculate MVP score (same formula as match awards)
 */
function calcMvpScore(entry: StatEntry): number {
  const blocks = entry.block_solos + entry.block_assists * 0.5;
  return entry.kills * 2 + entry.aces * 3 + entry.digs + blocks * 2 - (entry.attack_errors + entry.service_errors) * 1.5;
}

/**
 * Calculate season awards
 */
export function calculateSeasonAwards(data: SeasonStatData): { award_type: SeasonAwardType; player_id: string; award_value: number; description?: string }[] {
  const { statEntries, attendanceByPlayer, playerIds } = data;
  const awards: { award_type: SeasonAwardType; player_id: string; award_value: number; description?: string }[] = [];

  if (playerIds.length === 0) return awards;

  // Group stat entries by player
  const statsByPlayer: Record<string, (StatEntry & { event_start: string })[]> = {};
  for (const entry of statEntries) {
    if (!statsByPlayer[entry.player_id]) statsByPlayer[entry.player_id] = [];
    statsByPlayer[entry.player_id].push(entry);
  }

  // Season MVP: highest avg MVP score across finalized games
  let bestMvp: { playerId: string; avg: number } | null = null;
  for (const [playerId, entries] of Object.entries(statsByPlayer)) {
    if (entries.length === 0) continue;
    const avgScore = entries.reduce((sum, e) => sum + calcMvpScore(e), 0) / entries.length;
    if (!bestMvp || avgScore > bestMvp.avg) {
      bestMvp = { playerId, avg: avgScore };
    }
  }
  if (bestMvp) {
    awards.push({ award_type: 'season_mvp', player_id: bestMvp.playerId, award_value: Math.round(bestMvp.avg * 10) / 10 });
  }

  // Most Improved: split season in half by date, compare avg sub-ratings
  if (statEntries.length > 0) {
    const sortedEntries = [...statEntries].sort((a, b) => a.event_start.localeCompare(b.event_start));
    const midDate = sortedEntries[Math.floor(sortedEntries.length / 2)]?.event_start || '';

    let bestImproved: { playerId: string; improvement: number } | null = null;
    for (const [playerId, entries] of Object.entries(statsByPlayer)) {
      const firstHalf = entries.filter((e) => e.event_start <= midDate);
      const secondHalf = entries.filter((e) => e.event_start > midDate);
      if (firstHalf.length < 2 || secondHalf.length < 2) continue;

      const avgFirst = firstHalf.reduce((sum, e) => sum + calcMvpScore(e), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, e) => sum + calcMvpScore(e), 0) / secondHalf.length;
      const improvement = avgSecond - avgFirst;

      if (improvement > 0 && (!bestImproved || improvement > bestImproved.improvement)) {
        bestImproved = { playerId, improvement };
      }
    }
    if (bestImproved) {
      awards.push({ award_type: 'most_improved', player_id: bestImproved.playerId, award_value: Math.round(bestImproved.improvement * 10) / 10 });
    }
  }

  // Best Attendance: highest attendance %
  let bestAttendance: { playerId: string; rate: number } | null = null;
  for (const [playerId, att] of Object.entries(attendanceByPlayer)) {
    if (att.total === 0) continue;
    const rate = att.attended / att.total;
    if (!bestAttendance || rate > bestAttendance.rate) {
      bestAttendance = { playerId, rate };
    }
  }
  if (bestAttendance) {
    awards.push({ award_type: 'best_attendance', player_id: bestAttendance.playerId, award_value: Math.round(bestAttendance.rate * 1000) / 10 });
  }

  // Top Attacker: best kill% (min 20 attempts)
  let bestAttacker: { playerId: string; killPct: number } | null = null;
  for (const [playerId, entries] of Object.entries(statsByPlayer)) {
    const totalAttempts = entries.reduce((s, e) => s + e.attack_attempts, 0);
    if (totalAttempts < 20) continue;
    const totalKills = entries.reduce((s, e) => s + e.kills, 0);
    const totalErrors = entries.reduce((s, e) => s + e.attack_errors, 0);
    const killPct = (totalKills - totalErrors) / totalAttempts;
    if (!bestAttacker || killPct > bestAttacker.killPct) {
      bestAttacker = { playerId, killPct };
    }
  }
  if (bestAttacker) {
    awards.push({ award_type: 'top_attacker', player_id: bestAttacker.playerId, award_value: Math.round(bestAttacker.killPct * 1000) / 10 });
  }

  // Top Server: best ace rate
  let bestServer: { playerId: string; aceRate: number } | null = null;
  for (const [playerId, entries] of Object.entries(statsByPlayer)) {
    const totalServes = entries.reduce((s, e) => s + e.serve_attempts, 0);
    if (totalServes === 0) continue;
    const totalAces = entries.reduce((s, e) => s + e.aces, 0);
    const aceRate = totalAces / totalServes;
    if (!bestServer || aceRate > bestServer.aceRate) {
      bestServer = { playerId, aceRate };
    }
  }
  if (bestServer) {
    awards.push({ award_type: 'top_server', player_id: bestServer.playerId, award_value: Math.round(bestServer.aceRate * 1000) / 10 });
  }

  // Top Defender: most digs per set played
  let bestDefender: { playerId: string; digsPerSet: number } | null = null;
  for (const [playerId, entries] of Object.entries(statsByPlayer)) {
    const totalSets = entries.reduce((s, e) => s + e.sets_played, 0);
    if (totalSets === 0) continue;
    const totalDigs = entries.reduce((s, e) => s + e.digs, 0);
    const digsPerSet = totalDigs / totalSets;
    if (!bestDefender || digsPerSet > bestDefender.digsPerSet) {
      bestDefender = { playerId, digsPerSet };
    }
  }
  if (bestDefender) {
    awards.push({ award_type: 'top_defender', player_id: bestDefender.playerId, award_value: Math.round(bestDefender.digsPerSet * 100) / 100 });
  }

  // Top Passer: best pass rating (min 20 attempts)
  let bestPasser: { playerId: string; rating: number } | null = null;
  for (const [playerId, entries] of Object.entries(statsByPlayer)) {
    const totalAttempts = entries.reduce((s, e) => s + e.pass_attempts, 0);
    if (totalAttempts < 20) continue;
    const totalSum = entries.reduce((s, e) => s + e.pass_sum, 0);
    const rating = totalSum / totalAttempts;
    if (!bestPasser || rating > bestPasser.rating) {
      bestPasser = { playerId, rating };
    }
  }
  if (bestPasser) {
    awards.push({ award_type: 'top_passer', player_id: bestPasser.playerId, award_value: Math.round(bestPasser.rating * 100) / 100 });
  }

  // Most Practices attended
  let bestPractices: { playerId: string; count: number } | null = null;
  for (const [playerId, att] of Object.entries(attendanceByPlayer)) {
    if (att.practices === 0) continue;
    if (!bestPractices || att.practices > bestPractices.count) {
      bestPractices = { playerId, count: att.practices };
    }
  }
  if (bestPractices) {
    awards.push({ award_type: 'most_practices', player_id: bestPractices.playerId, award_value: bestPractices.count });
  }

  return awards;
}

/**
 * Finalize a team season: calculate and save awards, mark finalized
 */
export async function finalizeTeamSeason(seasonId: string): Promise<SeasonAward[]> {
  const season = await getTeamSeason(seasonId);
  if (!season) throw new Error('Season not found');

  const data = await fetchSeasonData(season.team_id, season.start_date, season.end_date);
  const calculatedAwards = calculateSeasonAwards(data);

  if (calculatedAwards.length > 0) {
    const rows = calculatedAwards.map((a) => ({
      season_id: seasonId,
      player_id: a.player_id,
      award_type: a.award_type,
      award_value: a.award_value,
      description: a.description,
    }));

    const { error: insertErr } = await supabase.from('season_awards').insert(rows);
    if (insertErr) {
      console.error('Error saving season awards:', insertErr);
      throw insertErr;
    }
  }

  const { error } = await supabase
    .from('team_seasons')
    .update({ is_finalized: true, finalized_at: new Date().toISOString() })
    .eq('id', seasonId);

  if (error) {
    console.error('Error finalizing team season:', error);
    throw error;
  }

  return getSeasonAwards(seasonId);
}
