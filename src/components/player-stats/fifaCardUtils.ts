import type { VolleyballPosition } from '@/types/database.types';

/**
 * Get card gradient classes based on overall rating
 */
export function getCardGradient(rating: number): string {
  if (rating >= 90) return 'from-yellow-400 via-amber-500 to-yellow-600';
  if (rating >= 80) return 'from-purple-500 via-indigo-600 to-purple-700';
  if (rating >= 70) return 'from-blue-500 via-cyan-600 to-blue-700';
  if (rating >= 60) return 'from-green-500 via-emerald-600 to-green-700';
  if (rating >= 50) return 'from-gray-400 via-slate-500 to-gray-600';
  return 'from-amber-700 via-orange-800 to-amber-900';
}

/**
 * Get position abbreviation for display
 */
export function getPositionAbbr(position: VolleyballPosition): string {
  const abbr: Record<VolleyballPosition, string> = {
    setter: 'SET',
    outside_hitter: 'OH',
    middle_blocker: 'MB',
    opposite: 'OPP',
    libero: 'LIB',
    defensive_specialist: 'DS',
    all_around: 'ALL',
  };
  return abbr[position];
}

/**
 * Get position full name
 */
export function getPositionName(position: VolleyballPosition): string {
  const names: Record<VolleyballPosition, string> = {
    setter: 'Setter',
    outside_hitter: 'Outside Hitter',
    middle_blocker: 'Middle Blocker',
    opposite: 'Opposite',
    libero: 'Libero',
    defensive_specialist: 'Defensive Specialist',
    all_around: 'All Around',
  };
  return names[position];
}
