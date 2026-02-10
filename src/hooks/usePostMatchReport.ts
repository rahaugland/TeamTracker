import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getStatEntriesForEvent } from '@/services/player-stats.service';
import {
  getAwardsForEvent,
  calculateMatchAwards,
  type CalculatedAward,
} from '@/services/game-awards.service';
import type { Event, StatEntry, GameAward } from '@/types/database.types';

export interface PlayerInfo {
  id: string;
  name: string;
  photo_url?: string;
  positions?: string[];
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
  digs: number;
  blockSolos: number;
  blockAssists: number;
  passRating: number;
  isMvp: boolean;
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
  passRating: number;
}

export interface PostMatchReportData {
  event: Event | null;
  teamTotals: TeamTotals | null;
  playerStatLines: PlayerStatLine[];
  awards: (GameAward | CalculatedAward)[];
  playerMap: Map<string, PlayerInfo>;
  keyTakeaways: string[];
  isLoading: boolean;
  error: string | null;
}

function deriveTeamTotals(entries: StatEntry[]): TeamTotals {
  let kills = 0, attackAttempts = 0, attackErrors = 0, aces = 0, serviceErrors = 0;
  let serveAttempts = 0, digs = 0, blockSolos = 0, blockAssists = 0;
  let passSum = 0, passAttempts = 0;

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
    passSum += e.pass_sum;
    passAttempts += e.pass_attempts;
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
    passRating: passAttempts > 0 ? passSum / passAttempts : 0,
  };
}

function deriveKeyTakeaways(totals: TeamTotals, event: Event): string[] {
  const takeaways: string[] = [];
  const won = (event.sets_won ?? 0) > (event.sets_lost ?? 0);

  if (totals.killPct >= 0.3) {
    takeaways.push('Strong attack efficiency — kill percentage above 30%');
  } else if (totals.killPct < 0.15 && totals.attackAttempts > 0) {
    takeaways.push('Attack efficiency needs work — kill percentage below 15%');
  }

  if (totals.servePct >= 0.92) {
    takeaways.push('Excellent serving consistency with low error rate');
  } else if (totals.servePct < 0.85 && totals.serveAttempts > 0) {
    takeaways.push('Too many service errors — focus on serve accuracy');
  }

  if (totals.passRating >= 2.2) {
    takeaways.push('Strong passing game with pass rating above 2.2');
  } else if (totals.passRating > 0 && totals.passRating < 1.5) {
    takeaways.push('Passing needs improvement — rating below 1.5');
  }

  if (totals.aces >= 8) {
    takeaways.push(`Great serving pressure with ${totals.aces} aces`);
  }

  if (won) {
    takeaways.push('Team secured the win — momentum heading into next match');
  } else {
    takeaways.push('Loss provides learning opportunities for the next match');
  }

  return takeaways.slice(0, 4);
}

export function usePostMatchReport(
  eventId: string | undefined,
  teamId: string | undefined
): PostMatchReportData {
  const [event, setEvent] = useState<Event | null>(null);
  const [statEntries, setStatEntries] = useState<StatEntry[]>([]);
  const [savedAwards, setSavedAwards] = useState<GameAward[]>([]);
  const [playerMap, setPlayerMap] = useState<Map<string, PlayerInfo>>(new Map());
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
        .select('player_id, player:players(id, name, photo_url, positions)')
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
              });
            }
          }
          return map;
        }),
    ]).then(([ev, stats, awards, pMap]) => {
      if (!cancelled) {
        setEvent(ev);
        setStatEntries(stats);
        setSavedAwards(awards);
        setPlayerMap(pMap);
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
    return statEntries.map((e) => {
      const info = playerMap.get(e.player_id);
      const killPct = e.attack_attempts > 0 ? (e.kills - e.attack_errors) / e.attack_attempts : 0;
      const passRating = e.pass_attempts > 0 ? e.pass_sum / e.pass_attempts : 0;

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
        digs: e.digs,
        blockSolos: e.block_solos,
        blockAssists: e.block_assists,
        passRating,
        isMvp: e.player_id === mvpPlayerId,
      };
    }).sort((a, b) => b.kills - a.kills);
  }, [statEntries, playerMap, mvpPlayerId]);

  const keyTakeaways = useMemo(() => {
    if (!teamTotals || !event) return [];
    return deriveKeyTakeaways(teamTotals, event);
  }, [teamTotals, event]);

  return { event, teamTotals, playerStatLines, awards, playerMap, keyTakeaways, isLoading, error };
}
