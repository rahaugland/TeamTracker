import { cn } from '@/lib/utils';
import type { AttendanceStats } from '@/services/player-stats.service';

interface AttendanceStatsRowProps {
  stats: AttendanceStats;
}

/**
 * 4-card row showing key attendance metrics:
 * - Overall Rate %
 * - Events Attended
 * - Missed
 * - Late Arrivals
 */
export function AttendanceStatsRow({ stats }: AttendanceStatsRowProps) {
  const attendancePercent = Math.round(stats.attendanceRate * 100);

  // Determine color based on attendance rate
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Overall Rate */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6 text-center">
        <p className={cn(
          'font-mono font-bold text-4xl mb-2',
          getAttendanceColor(attendancePercent)
        )}>
          {attendancePercent}%
        </p>
        <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-gray-500">
          Overall Rate
        </p>
      </div>

      {/* Events Attended */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6 text-center">
        <p className="font-mono font-bold text-4xl text-white mb-2">
          {stats.attended}
        </p>
        <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-gray-500">
          Events Attended
        </p>
      </div>

      {/* Missed */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6 text-center">
        <p className={cn(
          'font-mono font-bold text-4xl mb-2',
          stats.absent > 0 ? 'text-yellow-400' : 'text-white'
        )}>
          {stats.absent}
        </p>
        <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-gray-500">
          Missed
        </p>
      </div>

      {/* Late Arrivals */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-6 text-center">
        <p className={cn(
          'font-mono font-bold text-4xl mb-2',
          stats.late > 0 ? 'text-vq-teal' : 'text-white'
        )}>
          {stats.late}
        </p>
        <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-gray-500">
          Late Arrivals
        </p>
      </div>
    </div>
  );
}
