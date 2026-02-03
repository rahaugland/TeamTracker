import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatInputRow } from './StatInputRow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PlayingTimeCardProps {
  rotation: number | null;
  setsPlayed: number;
  rotationsPlayed: number;
  onRotationChange: (rotation: number | null) => void;
  onSetsPlayedChange: (value: number) => void;
  onRotationsPlayedChange: (value: number) => void;
  className?: string;
}

/**
 * PlayingTimeCard component
 * Displays and edits playing time stats: rotation, sets played, rotations played
 */
export function PlayingTimeCard({
  rotation,
  setsPlayed,
  rotationsPlayed,
  onRotationChange,
  onSetsPlayedChange,
  onRotationsPlayedChange,
  className,
}: PlayingTimeCardProps) {
  return (
    <div
      className={cn(
        'bg-navy-90 border border-white/5 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Colored top border */}
      <div className="h-1 bg-gray-500" />

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gray-500 flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-sm uppercase tracking-wider text-white">
          Playing Time
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Starting Rotation */}
        <div className="flex items-center justify-between gap-4">
          <span className="font-display font-semibold text-xs uppercase tracking-wide text-gray-400 flex-1">
            Starting Rotation
          </span>
          <Select
            value={rotation?.toString() ?? 'none'}
            onValueChange={(val) =>
              onRotationChange(val === 'none' ? null : parseInt(val))
            }
          >
            <SelectTrigger className="w-16 h-8 bg-navy-80 border-white/10">
              <SelectValue placeholder="\u2014" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">\u2014</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="6">6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <StatInputRow
          label="Sets Played"
          value={setsPlayed}
          onChange={onSetsPlayedChange}
          max={5}
        />

        <StatInputRow
          label="Rotations Played"
          value={rotationsPlayed}
          onChange={onRotationsPlayedChange}
          max={30}
        />
      </div>
    </div>
  );
}
