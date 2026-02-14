import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getStatEntriesForEvent, calculateSingleGameRating } from '@/services/player-stats.service';
import {
  getAwardsForEvent,
  calculateMatchAwards,
  type CalculatedAward,
} from '@/services/game-awards.service';
import { getTeamGameStats } from '@/services/team-stats.service';
import type { Event, StatEntry, GameAward, VolleyballPosition } from '@/types/database.types';

export interface PlayerInfo {
  id: string;
  name: string;
  photo_url?: string;
  positions?: string[];
  jerseyNumber?: number;
}

export interface PlayerStatLine {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  kills: number;
  attackErrors: number;
  attackAttempts: number;
  killPct: number;
  aces: number;
  serviceErrors: number;
  serveAttempts: number;
  digs: number;
  blockSolos: number;
  blockAssists: number;
  blockTouches: number;
  ballHandlingErrors: number;
  passAttempts: number;
  passSum: number;
  passRating: number;
  setAttempts: number;
  setSum: number;
  settingErrors: number;
  setsPlayed: number;
  rotationsPlayed: number;
  rotation: number | null;
  isMvp: boolean;
  gameRating: number;
}

export interface TeamTotals {
  kills: number;
  attackAttempts: number;
  attackErrors: number;
  killPct: number;
  aces: number;
  serviceErrors: number;
  serveAttempts: number;
  servePct: number;
  digs: number;
  blocks: number;
  blockSolos: number;
  blockAssists: number;
  blockTouches: number;
  ballHandlingErrors: number;
  passAttempts: number;
  passSum: number;
  passRating: number;
  setAttempts: number;
  setSum: number;
  settingErrors: number;
}

export interface SeasonAverages {
  killPct: number;
  servePct: number;
  passRating: number;
  kills: number;
  aces: number;
  digs: number;
}

export type TakeawayCategory = 'positive' | 'improvement' | 'milestone';

export interface CategorizedTakeaway {
  text: string;
  category: TakeawayCategory;
}

export interface PostMatchReportData {
  event: Event | null;
  teamTotals: TeamTotals | null;
  seasonAverages: SeasonAverages | null;
  playerStatLines: PlayerStatLine[];
  awards: (GameAward | CalculatedAward)[];
  playerMap: Map<string, PlayerInfo>;
  keyTakeaways: string[];
  categorizedTakeaways: CategorizedTakeaway[];
  isLoading: boolean;
  error: string | null;
}

function deriveTeamTotals(entries: StatEntry[]): TeamTotals {
  let kills = 0, attackAttempts = 0, attackErrors = 0, aces = 0, serviceErrors = 0;
  let serveAttempts = 0, digs = 0, blockSolos = 0, blockAssists = 0, blockTouches = 0;
  let ballHandlingErrors = 0, passSum = 0, passAttempts = 0;
  let setAttempts = 0, setSum = 0, settingErrors = 0;

  for (const e of entries) {
    kills += e.kills;
    attackAttempts += e.attack_attempts;
    attackErrors += e.attack_errors;
    aces += e.aces;
    serviceErrors += e.service_errors;
    serveAttempts += e.serve_attempts;
    digs += e.digs;
    blockSolos += e.block_solos;
    blockAssists += e.block_assists;
    blockTouches += e.block_touches;
    ballHandlingErrors += e.ball_handling_errors;
    passSum += e.pass_sum;
    passAttempts += e.pass_attempts;
    setAttempts += e.set_attempts;
    setSum += e.set_sum;
    settingErrors += e.setting_errors;
  }

  return {
    kills,
    attackAttempts,
    attackErrors,
    killPct: attackAttempts > 0 ? (kills - attackErrors) / attackAttempts : 0,
    aces,
    serviceErrors,
    serveAttempts,
    servePct: serveAttempts > 0 ? (serveAttempts - serviceErrors) / serveAttempts : 0,
    digs,
    blocks: blockSolos + blockAssists * 0.5,
    blockSolos,
    blockAssists,
    blockTouches,
    ballHandlingErrors,
    passAttempts,
    passSum,
    passRating: passAttempts > 0 ? passSum / passAttempts : 0,
    setAttempts,
    setSum,
    settingErrors,
  };
}

function deriveCategorizedTakeaways(totals: TeamTotals, event: Event): CategorizedTakeaway[] {
  const takeaways: CategorizedTakeaway[] = [];
  const won = (event.sets_won ?? 0) > (event.sets_lost ?? 0);

  // Positive takeaways
  if (totals.killPct >= 0.3) {
    takeaways.push({ text: 'Strong attack efficiency — kill percentage above 30%', category: 'positive' });
  }
  if (totals.servePct >= 0.92) {
    takeaways.push({ text: 'Excellent serving consistency with low error rate', category: 'positive' });
  }
  if (totals.passRating >= 2.2) {
    takeaways.push({ text: 'Strong passing game with pass rating above 2.2', category: 'positive' });
  }
  if (totals.aces >= 8) {
    takeaways.push({ text: `Great serving pressure with ${totals.aces} aces`, category: 'positive' });
  }

  // Areas to address
  if (totals.killPct < 0.15 && totals.attackAttempts > 0) {
    takeaways.push({ text: 'Attack efficiency needs work — kill percentage below 15%', category: 'improvement' });
  }
  if (totals.servePct < 0.85 && totals.serveAttempts > 0) {
    takeaways.push({ text: 'Too many service errors — focus on serve accuracy', category: 'improvement' });
  }
  if (totals.passRating > 0 && totals.passRating < 1.5) {
    takeaways.push({ text: 'Passing needs improvement — rating below 1.5', category: 'improvement' });
  }

  // Milestones
  if (won) {
    takeaways.push({ text: 'Team secured the win — momentum heading into next match', category: 'milestone' });
  } else {
    takeaways.push({ text: 'Loss provides learning opportunities for the next match', category: 'milestone' });
  }

  const setsWon = event.sets_won ?? 0;
  const setsLost = event.sets_lost ?? 0;
  if (setsWon === 3 && setsLost === 0) {
    takeaways.push({ text: 'Clean sweep — dominant 3-0 victory', category: 'milestone' });
  } else if (won && setsLost >= 2) {
    takeaways.push({ text: 'Comeback resilience — won after trailing in sets', category: 'milestone' });
  }

  return takeaways;
}

export function usePostMatchReport(
  eventId: string | undefined,
  teamId: string | undefined
): PostMatchReportData {
  const [event, setEvent] = useState<Event | null>(null);
  const [statEntries, setStatEntries] = useState<StatEntry[]>([]);
  const [savedAwards, setSavedAwards] = useState<GameAward[]>([]);
  const [playerMap, setPlayerMap] = useState<Map<string, PlayerInfo>>(new Map());
  const [seasonAverages, setSeasonAverages] = useState<SeasonAverages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single().then(({ data, error }) => {
        if (error) throw error;
        return data as Event;
      }),
      getStatEntriesForEvent(eventId).catch(() => []),
      getAwardsForEvent(eventId).catch(() => []),
      supabase
        .from('team_memberships')
        .select('player_id, jersey_number, player:players(id, name, photo_url, positions)')
        .eq('team_id', teamId)
        .then(({ data }) => {
          const map = new Map<string, PlayerInfo>();
          for (const m of (data || []) as any[]) {
            if (m.player) {
              map.set(m.player_id, {
                id: m.player.id,
                name: m.player.name,
                photo_url: m.player.photo_url,
                positions: m.player.positions,
                jerseyNumber: m.jersey_number,
              });
            }
          }
          return map;
        }),
      getTeamGameStats(teamId).catch(() => []),
    ]).then(([ev, stats, awards, pMap, allGameStats]) => {
      if (!cancelled) {
        setEvent(ev);
        setStatEntries(stats);
        setSavedAwards(awards);
        setPlayerMap(pMap);

        // Calculate season averages from all completed games
        const now = new Date().toISOString();
        const completedGames = allGameStats.filter((g) => g.date <= now);
        if (completedGames.length > 0) {
          const avgKillPct = completedGames.reduce((s, g) => s + g.killPercentage, 0) / completedGames.length;
          const avgServePct = completedGames.reduce((s, g) => s + g.servePercentage, 0) / completedGames.length;
          const avgPassRating = completedGames.reduce((s, g) => s + g.passRating, 0) / completedGames.length;
          setSeasonAverages({
            killPct: avgKillPct,
            servePct: avgServePct,
            passRating: avgPassRating,
            kills: 0,
            aces: 0,
            digs: 0,
          });
        }

        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load match report');
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [eventId, teamId]);

  const teamTotals = useMemo(
    () => (statEntries.length > 0 ? deriveTeamTotals(statEntries) : null),
    [statEntries]
  );

  const awards = useMemo(() => {
    if (savedAwards.length > 0) return savedAwards;
    if (statEntries.length > 0) return calculateMatchAwards(statEntries);
    return [];
  }, [savedAwards, statEntries]);

  const mvpPlayerId = useMemo(() => {
    const mvp = awards.find((a) => a.award_type === 'mvp');
    return mvp?.player_id ?? null;
  }, [awards]);

  const playerStatLines = useMemo((): PlayerStatLine[] => {
    const opponentTier = event?.opponent_tier ?? 5;
    return statEntries.map((e) => {
      const info = playerMap.get(e.player_id);
      const killPct = e.attack_attempts > 0 ? (e.kills - e.attack_errors) / e.attack_attempts : 0;
      const passRating = e.pass_attempts > 0 ? e.pass_sum / e.pass_attempts : 0;
      const position = (info?.positions?.[0] as VolleyballPosition) ?? 'all_around';
      const gameRating = calculateSingleGameRating(e, opponentTier, position);

      return {
        playerId: e.player_id,
        playerName: info?.name ?? 'Unknown',
        photoUrl: info?.photo_url,
        kills: e.kills,
        attackErrors: e.attack_errors,
        attackAttempts: e.attack_attempts,
        killPct,
        aces: e.aces,
        serviceErrors: e.service_errors,
        serveAttempts: e.serve_attempts,
        digs: e.digs,
        blockSolos: e.block_solos,
        blockAssists: e.block_assists,
        blockTouches: e.block_touches,
        ballHandlingErrors: e.ball_handling_errors,
        passAttempts: e.pass_attempts,
        passSum: e.pass_sum,
        passRating,
        setAttempts: e.set_attempts,
        setSum: e.set_sum,
        settingErrors: e.setting_errors,
        setsPlayed: e.sets_played,
        rotationsPlayed: e.rotations_played,
        rotation: e.rotation ?? null,
        isMvp: e.player_id === mvpPlayerId,
        gameRating,
      };
    }).sort((a, b) => b.gameRating - a.gameRating);
  }, [statEntries, playerMap, mvpPlayerId, event]);

  const categorizedTakeaways = useMemo(() => {
    if (!teamTotals || !event) return [];
    return deriveCategorizedTakeaways(teamTotals, event);
  }, [teamTotals, event]);

  const keyTakeaways = useMemo(() => {
    return categorizedTakeaways.map((t) => t.text);
  }, [categorizedTakeaways]);

  return { event, teamTotals, seasonAverages, playerStatLines, awards, playerMap, keyTakeaways, categorizedTakeaways, isLoading, error };
}
