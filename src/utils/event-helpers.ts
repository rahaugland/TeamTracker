import type { StatEntry } from '@/types/database.types';
import type { RsvpWithPlayer } from '@/services/rsvp.service';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import type { PlayerWithMemberships } from '@/services/players.service';

export interface TeamTotals {
  kills: number;
  attack_errors: number;
  attack_attempts: number;
  aces: number;
  service_errors: number;
  serve_attempts: number;
  digs: number;
  block_solos: number;
  block_assists: number;
  ball_handling_errors: number;
  pass_attempts: number;
  pass_sum: number;
}

export interface RSVPSummary {
  attending: number;
  not_attending: number;
  maybe: number;
  pending: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  not_selected: number;
}

/**
 * Formats a date string for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates team stat totals from stat entries
 */
export function calculateTeamTotals(statEntries: StatEntry[]): TeamTotals {
  return statEntries.reduce(
    (totals, entry) => ({
      kills: totals.kills + entry.kills,
      attack_errors: totals.attack_errors + entry.attack_errors,
      attack_attempts: totals.attack_attempts + entry.attack_attempts,
      aces: totals.aces + entry.aces,
      service_errors: totals.service_errors + entry.service_errors,
      serve_attempts: totals.serve_attempts + entry.serve_attempts,
      digs: totals.digs + entry.digs,
      block_solos: totals.block_solos + entry.block_solos,
      block_assists: totals.block_assists + entry.block_assists,
      ball_handling_errors: totals.ball_handling_errors + entry.ball_handling_errors,
      pass_attempts: totals.pass_attempts + entry.pass_attempts,
      pass_sum: totals.pass_sum + entry.pass_sum,
    }),
    {
      kills: 0,
      attack_errors: 0,
      attack_attempts: 0,
      aces: 0,
      service_errors: 0,
      serve_attempts: 0,
      digs: 0,
      block_solos: 0,
      block_assists: 0,
      ball_handling_errors: 0,
      pass_attempts: 0,
      pass_sum: 0,
    }
  );
}

/**
 * Calculates RSVP summary counts
 */
export function getRSVPSummary(rsvps: RsvpWithPlayer[], teamPlayers: PlayerWithMemberships[]): RSVPSummary {
  return {
    attending: rsvps.filter((r) => r.status === 'attending').length,
    not_attending: rsvps.filter((r) => r.status === 'not_attending').length,
    maybe: rsvps.filter((r) => r.status === 'maybe').length,
    pending: teamPlayers.length - rsvps.length,
  };
}

/**
 * Calculates attendance summary counts
 */
export function getAttendanceSummary(attendance: AttendanceRecordWithPlayer[]): AttendanceSummary {
  return {
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    excused: attendance.filter((a) => a.status === 'excused').length,
    not_selected: attendance.filter((a) => a.status === 'not_selected').length,
  };
}
