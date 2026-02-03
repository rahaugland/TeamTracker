import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TimePeriod, CustomDateRange } from '@/services/player-stats.service';

interface TimePeriodSelectorProps {
  period: TimePeriod;
  customRange?: CustomDateRange;
  onPeriodChange: (period: TimePeriod, customRange?: CustomDateRange) => void;
  variant?: 'select' | 'buttons';
}

/**
 * Selector for time period filter (game/season/career/custom/last5)
 * Supports two variants: select dropdown or button pills
 */
export function TimePeriodSelector({
  period,
  customRange,
  onPeriodChange,
  variant = 'select',
}: TimePeriodSelectorProps) {
  const [localStartDate, setLocalStartDate] = useState(customRange?.startDate || '');
  const [localEndDate, setLocalEndDate] = useState(customRange?.endDate || '');

  const handlePeriodChange = (value: string) => {
    const newPeriod = value as TimePeriod;

    if (newPeriod !== 'custom') {
      onPeriodChange(newPeriod);
    } else {
      onPeriodChange(newPeriod, {
        startDate: localStartDate || new Date().toISOString().split('T')[0],
        endDate: localEndDate || new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleCustomRangeChange = () => {
    if (period === 'custom' && localStartDate && localEndDate) {
      onPeriodChange('custom', {
        startDate: localStartDate,
        endDate: localEndDate,
      });
    }
  };

  // Button variant for inline period selection
  if (variant === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <PeriodButton
          label="Last 5 Games"
          value="last5"
          currentPeriod={period}
          onSelect={handlePeriodChange}
        />
        <PeriodButton
          label="This Season"
          value="season"
          currentPeriod={period}
          onSelect={handlePeriodChange}
        />
        <PeriodButton
          label="Career"
          value="career"
          currentPeriod={period}
          onSelect={handlePeriodChange}
        />
        <PeriodButton
          label="Custom Range"
          value="custom"
          currentPeriod={period}
          onSelect={handlePeriodChange}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="period-select">Time Period</Label>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger id="period-select" className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last5">Last 5 Games</SelectItem>
                <SelectItem value="game">Last Game</SelectItem>
                <SelectItem value="season">Current Season</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  onBlur={handleCustomRangeChange}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  onBlur={handleCustomRangeChange}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for period button
interface PeriodButtonProps {
  label: string;
  value: TimePeriod;
  currentPeriod: TimePeriod;
  onSelect: (value: string) => void;
}

function PeriodButton({ label, value, currentPeriod, onSelect }: PeriodButtonProps) {
  const isActive = currentPeriod === value;

  return (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        'font-display font-semibold text-[11px] uppercase tracking-wider',
        'px-4 py-2 rounded-full border transition-all',
        isActive
          ? 'bg-club-primary text-white border-club-primary'
          : 'bg-navy-80 text-gray-400 border-transparent hover:text-white hover:border-white/10'
      )}
    >
      {label}
    </button>
  );
}
