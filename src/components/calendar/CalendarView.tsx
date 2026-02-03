import { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Event, EventType } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  events: Event[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

/**
 * CalendarView component
 * Displays events in a monthly calendar grid with color-coded event types
 * Memoized for performance with large event lists
 */
export const CalendarView = memo(function CalendarView({ events }: CalendarViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getEventTypeColor = useCallback((type: EventType) => {
    const colors: Record<EventType, string> = {
      practice: 'bg-vq-teal',
      game: 'bg-emerald-500',
      tournament: 'bg-purple-500',
      meeting: 'bg-club-secondary',
      other: 'bg-muted-foreground',
    };
    return colors[type];
  }, []);

  const getMonthDays = (year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date),
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateOnly.getTime() === today.getTime(),
        events: getEventsForDate(date),
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date),
      });
    }

    return days;
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }, [currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const formatEventTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const monthDays = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate, events]
  );
  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekDays = [
    t('calendar.days.sun'),
    t('calendar.days.mon'),
    t('calendar.days.tue'),
    t('calendar.days.wed'),
    t('calendar.days.thu'),
    t('calendar.days.fri'),
    t('calendar.days.sat'),
  ];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            {t('calendar.today')}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-vq-teal"></div>
          <span>{t('event.types.practice')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span>{t('event.types.game')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>{t('event.types.tournament')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-club-secondary"></div>
          <span>{t('event.types.meeting')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
          <span>{t('event.types.other')}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 bg-muted">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-semibold border-r border-b last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'min-h-24 md:min-h-32 border-r border-b last:border-r-0 p-1 md:p-2',
                !day.isCurrentMonth && 'bg-muted/30',
                day.isToday && 'bg-primary/5'
              )}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1',
                  !day.isCurrentMonth && 'text-muted-foreground',
                  day.isToday && 'text-primary font-bold'
                )}
              >
                {day.date.getDate()}
              </div>

              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className={cn(
                      'text-xs p-1 rounded cursor-pointer text-white truncate hover:opacity-80 transition-opacity',
                      getEventTypeColor(event.type)
                    )}
                    title={`${event.title} - ${formatEventTime(event.start_time)}`}
                  >
                    <div className="truncate">
                      <span className="hidden md:inline">{formatEventTime(event.start_time)} </span>
                      {event.title}
                    </div>
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-muted-foreground font-medium pl-1">
                    +{day.events.length - 3} {t('calendar.more')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mobile Event List for Selected Day - Optional Enhancement */}
      <div className="md:hidden">
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('calendar.tapEventToView')}
        </p>
      </div>
    </div>
  );
});
