import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';

export interface RSVPSummary {
  coming: number;
  notComing: number;
  pending: number;
}

export interface TodayEventCardProps {
  title: string;
  location: string;
  time: string;
  rsvpSummary: RSVPSummary;
  onViewDetails?: () => void;
  className?: string;
}

export function TodayEventCard({
  title,
  location,
  time,
  rsvpSummary,
  onViewDetails,
  className,
}: TodayEventCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-gradient-to-br from-club-primary to-club-primary/80',
        className
      )}
    >
      <div className="p-6">
        {/* Label */}
        <p className="font-display font-semibold text-[11px] uppercase tracking-[2px] text-white/70 mb-1">
          Today's Practice
        </p>

        {/* Title */}
        <h2 className="font-display font-extrabold text-2xl uppercase text-white leading-tight">
          {title}
        </h2>

        {/* Meta Info */}
        <div className="flex gap-6 mt-4 text-sm text-white/80">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {time}
          </span>
        </div>

        {/* RSVP Summary */}
        <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-green-400">
              {rsvpSummary.coming}
            </span>
            <span className="text-xs text-white/70">Coming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-red-400">
              {rsvpSummary.notComing}
            </span>
            <span className="text-xs text-white/70">Not Coming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-yellow-400">
              {rsvpSummary.pending}
            </span>
            <span className="text-xs text-white/70">Pending</span>
          </div>
        </div>

        {/* Action Button */}
        {onViewDetails && (
          <div className="mt-6">
            <Button
              onClick={onViewDetails}
              variant="secondary"
              className="w-full bg-white text-club-primary hover:bg-white/90 hover:text-club-primary font-bold"
            >
              View Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
