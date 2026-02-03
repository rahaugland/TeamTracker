/**
 * Shared types for match stats components
 */

export interface PlayerStatRow {
  playerId: string;
  playerName: string;
  statEntryId?: string;
  kills: number;
  attackErrors: number;
  attackAttempts: number;
  aces: number;
  serviceErrors: number;
  serveAttempts: number;
  digs: number;
  blockSolos: number;
  blockAssists: number;
  ballHandlingErrors: number;
  passAttempts: number;
  passSum: number;
  blockTouches: number;
  setAttempts: number;
  setSum: number;
  settingErrors: number;
  setsPlayed: number;
  rotationsPlayed: number;
  rotation: number | null;
}

export interface PlayerInfo {
  id: string;
  name: string;
  position?: string;
  jerseyNumber?: string;
  photoUrl?: string;
}

export type ViewMode = 'card' | 'spreadsheet';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';
