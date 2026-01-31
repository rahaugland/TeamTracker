import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import type { MissedEvent } from '@/services/player-stats.service';

interface MissedEventsTimelineProps {
  events: MissedEvent[];
}

/**
 * GitHub contribution-style heatmap showing attendance over time
 */
export function MissedEventsTimeline({ events }: MissedEventsTimelineProps) {
  // Group events by week and day
  const gridData = useMemo(() => {
    if (events.length === 0) return [];

    // Get date range
    const dates = events.map(e => new Date(e.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Generate grid (last 52 weeks or actual range if shorter)
    const weeks: Array<Array<{ date: string; status: string | null }>> = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7)); // 52 weeks ago

    const actualStartDate = minDate < startDate ? startDate : minDate;

    let currentDate = new Date(actualStartDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday

    while (currentDate <= today) {
      const week: Array<{ date: string; status: string | null }> = [];

      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const event = events.find(e => e.date === dateStr);

        week.push({
          date: dateStr,
          status: event ? event.status : null,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(week);
    }

    return weeks;
  }, [events]);

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100';

    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'late':
        return 'bg-yellow-500';
      case 'absent':
        return 'bg-red-500';
      case 'excused':
        return 'bg-blue-400';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'No event';

    switch (status) {
      case 'present':
        return 'Present';
      case 'late':
        return 'Late';
      case 'absent':
        return 'Absent';
      case 'excused':
        return 'Excused';
      default:
        return 'Unknown';
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No attendance data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-1">
            {gridData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${getStatusColor(day.status)} transition-all hover:ring-2 hover:ring-gray-400 cursor-pointer`}
                    title={`${day.date}: ${getStatusLabel(day.status)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4 border-t pt-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <span>Excused</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300" />
            <span>No event</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
