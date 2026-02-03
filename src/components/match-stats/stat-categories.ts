import type { PlayerStatRow } from './types';

export interface StatCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  stats: Array<{
    label: string;
    shortLabel: string;
    field: keyof PlayerStatRow;
  }>;
  calculated?: {
    label: string;
    compute: (row: PlayerStatRow) => string;
    getStatus?: (row: PlayerStatRow) => 'good' | 'average' | 'poor' | 'neutral';
  };
}

export const STAT_CATEGORIES: StatCategory[] = [
  {
    id: 'attack',
    title: 'Attack',
    icon: 'Swords',
    color: '#22C55E', // green
    stats: [
      { label: 'Kills (K)', shortLabel: 'K', field: 'kills' },
      { label: 'Attack Errors (E)', shortLabel: 'E', field: 'attackErrors' },
      { label: 'Attack Attempts (TA)', shortLabel: 'TA', field: 'attackAttempts' },
    ],
    calculated: {
      label: 'Kill Percentage',
      compute: (row) => {
        if (row.attackAttempts === 0) return '\u2014';
        const pct = ((row.kills - row.attackErrors) / row.attackAttempts) * 100;
        return pct.toFixed(1) + '%';
      },
      getStatus: (row) => {
        if (row.attackAttempts === 0) return 'neutral';
        const pct = ((row.kills - row.attackErrors) / row.attackAttempts) * 100;
        if (pct >= 30) return 'good';
        if (pct >= 15) return 'average';
        return 'poor';
      },
    },
  },
  {
    id: 'serve',
    title: 'Serve',
    icon: 'Target',
    color: '#E63946', // red
    stats: [
      { label: 'Aces', shortLabel: 'A', field: 'aces' },
      { label: 'Service Errors (SE)', shortLabel: 'SE', field: 'serviceErrors' },
      { label: 'Serve Attempts (SA)', shortLabel: 'SA', field: 'serveAttempts' },
    ],
    calculated: {
      label: 'Ace Percentage',
      compute: (row) => {
        if (row.serveAttempts === 0) return '\u2014';
        const pct = (row.aces / row.serveAttempts) * 100;
        return pct.toFixed(1) + '%';
      },
      getStatus: (row) => {
        if (row.serveAttempts === 0) return 'neutral';
        const pct = (row.aces / row.serveAttempts) * 100;
        if (pct >= 15) return 'good';
        if (pct >= 5) return 'average';
        return 'poor';
      },
    },
  },
  {
    id: 'block',
    title: 'Block',
    icon: 'Shield',
    color: '#3B82F6', // blue
    stats: [
      { label: 'Block Solos (BS)', shortLabel: 'BS', field: 'blockSolos' },
      { label: 'Block Assists (BA)', shortLabel: 'BA', field: 'blockAssists' },
      { label: 'Block Touches (BT)', shortLabel: 'BT', field: 'blockTouches' },
    ],
    calculated: {
      label: 'Total Blocks',
      compute: (row) => {
        const total = row.blockSolos + row.blockAssists * 0.5;
        return total.toFixed(1);
      },
      getStatus: () => 'neutral',
    },
  },
  {
    id: 'defense',
    title: 'Defense',
    icon: 'Circle',
    color: '#9333EA', // purple
    stats: [
      { label: 'Digs', shortLabel: 'D', field: 'digs' },
      { label: 'Ball Handling Errors', shortLabel: 'BHE', field: 'ballHandlingErrors' },
    ],
  },
  {
    id: 'passing',
    title: 'Passing / Receive',
    icon: 'Hand',
    color: '#2EC4B6', // teal
    stats: [
      { label: 'Pass Attempts (PA)', shortLabel: 'PA', field: 'passAttempts' },
      { label: 'Pass Sum (0-3 each)', shortLabel: 'PS', field: 'passSum' },
    ],
    calculated: {
      label: 'Pass Rating',
      compute: (row) => {
        if (row.passAttempts === 0) return '\u2014';
        const rating = row.passSum / row.passAttempts;
        return rating.toFixed(2);
      },
      getStatus: (row) => {
        if (row.passAttempts === 0) return 'neutral';
        const rating = row.passSum / row.passAttempts;
        if (rating >= 2.0) return 'good';
        if (rating >= 1.5) return 'average';
        return 'poor';
      },
    },
  },
  {
    id: 'setting',
    title: 'Setting',
    icon: 'Pointer',
    color: '#FFB703', // gold
    stats: [
      { label: 'Set Attempts (SA)', shortLabel: 'SA', field: 'setAttempts' },
      { label: 'Set Sum (0-3 each)', shortLabel: 'SS', field: 'setSum' },
      { label: 'Setting Errors', shortLabel: 'SE', field: 'settingErrors' },
    ],
    calculated: {
      label: 'Set Rating',
      compute: (row) => {
        if (row.setAttempts === 0) return '\u2014';
        const rating = row.setSum / row.setAttempts;
        return rating.toFixed(2);
      },
      getStatus: (row) => {
        if (row.setAttempts === 0) return 'neutral';
        const rating = row.setSum / row.setAttempts;
        if (rating >= 2.5) return 'good';
        if (rating >= 2.0) return 'average';
        return 'poor';
      },
    },
  },
];
