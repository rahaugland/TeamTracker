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
import type { TimePeriod, CustomDateRange } from '@/services/player-stats.service';

interface TimePeriodSelectorProps {
  period: TimePeriod;
  customRange?: CustomDateRange;
  onPeriodChange: (period: TimePeriod, customRange?: CustomDateRange) => void;
}

/**
 * Selector for time period filter (game/season/career/custom)
 */
export function TimePeriodSelector({
  period,
  customRange,
  onPeriodChange,
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
