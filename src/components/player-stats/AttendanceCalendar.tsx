import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAttendanceCalendar, type AttendanceCalendarDay } from '@/services/attendance.service';

interface AttendanceCalendarProps {
  playerId: string;
  teamId?: string;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Month calendar view with colored dots for attendance status
 * Navigation arrows for month switching
 */
export function AttendanceCalendar({ playerId, teamId }: AttendanceCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [calendarDays, setCalendarDays] = useState<AttendanceCalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    getAttendanceCalendar(playerId, currentYear, currentMonth, teamId)
      .then(days => {
        if (!cancelled) {
          setCalendarDays(days);
        }
      })
      .catch(err => console.error('Error loading attendance calendar:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [playerId, teamId, currentYear, currentMonth]);

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get what day of week the month starts on (0=Sunday to 6=Saturday)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Convert to Monday-based (0=Monday to 6=Sunday)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getStatusClass = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/30 text-green-400 hover:bg-green-500/40';
      case 'late':
        return 'bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/40';
      case 'absent':
        return 'bg-red-500/30 text-red-400 hover:bg-red-500/40';
      case 'excused':
        return 'bg-vq-teal/30 text-vq-teal hover:bg-vq-teal/40';
      default:
        return 'bg-navy-80 text-gray-500 hover:bg-navy-70';
    }
  };

  return (
    <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8 border-white/20 text-white hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8 border-white/20 text-white hover:bg-white/5"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map(day => (
            <div
              key={day}
              className="text-center font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {calendarDays.map(day => (
              <div
                key={day.date}
                className={cn(
                  'aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all',
                  'font-mono text-xs',
                  getStatusClass(day.status)
                )}
                title={day.eventTitle ? `${day.eventTitle} - ${day.status || 'No attendance'}` : 'No event'}
              >
                {day.dayOfMonth}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-green-500/30" />
            <span className="text-gray-400">Present</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-yellow-500/30" />
            <span className="text-gray-400">Late</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-red-500/30" />
            <span className="text-gray-400">Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
