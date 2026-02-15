import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitRSVP } from '@/services/rsvp.service';
import { useAuth } from '@/store';
import { useToastStore } from '@/hooks/useToast';
import type { RsvpStatus } from '@/types/database.types';

interface QuickRSVPButtonsProps {
  eventId: string;
  playerId: string;
  currentStatus?: RsvpStatus | string;
  onStatusChange?: (newStatus: RsvpStatus) => void;
}

export function QuickRSVPButtons({ eventId, playerId, currentStatus, onStatusChange }: QuickRSVPButtonsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToast } = useToastStore();
  const [status, setStatus] = useState<string | undefined>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const handleRsvp = async (newStatus: RsvpStatus, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event card click
    if (!user?.id || isSubmitting) return;

    const previousStatus = status;
    setStatus(newStatus); // Optimistic
    setIsSubmitting(true);
    setShowButtons(false);

    try {
      await submitRSVP({
        event_id: eventId,
        player_id: playerId,
        status: newStatus,
        responded_by: user.id,
      });
      onStatusChange?.(newStatus);
    } catch {
      setStatus(previousStatus); // Revert
      addToast({ variant: 'error', description: 'Failed to update RSVP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowButtons((prev) => !prev);
  };

  const hasResponded = status === 'attending' || status === 'not_attending';

  // Show badge when player has responded and buttons are hidden
  if (hasResponded && !showButtons) {
    return (
      <button
        onClick={handleBadgeClick}
        className={cn(
          'rounded-lg font-display text-[11px] uppercase tracking-wider px-2.5 py-1 border transition-all',
          status === 'attending' &&
            'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
          status === 'not_attending' &&
            'border-red-500/40 bg-red-500/10 text-red-400'
        )}
      >
        {status === 'attending' ? `✓ ${t('rsvp.status.attending')}` : `✕ ${t('rsvp.status.not_attending')}`}
      </button>
    );
  }

  // Show pending badge when no response yet (no buttons hidden)
  if (!hasResponded && !showButtons) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="rounded-lg font-display text-[11px] uppercase tracking-wider px-2.5 py-1 border border-amber-500/40 bg-amber-500/10 text-amber-400"
        >
          {t('event.rsvp')}
        </span>
        <button
          onClick={(e) => handleRsvp('attending', e)}
          disabled={isSubmitting}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'bg-white/[0.06] text-white/50 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10'
          )}
          aria-label="Attending"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => handleRsvp('not_attending', e)}
          disabled={isSubmitting}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'bg-white/[0.06] text-white/50 hover:bg-red-500/20 hover:text-red-400 border border-white/10'
          )}
          aria-label="Not attending"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Show buttons (either initially for pending, or when badge was clicked to change)
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={(e) => handleRsvp('attending', e)}
        disabled={isSubmitting}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
          status === 'attending'
            ? 'bg-emerald-500 text-white'
            : 'bg-white/[0.06] text-white/50 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10'
        )}
        aria-label="Attending"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => handleRsvp('not_attending', e)}
        disabled={isSubmitting}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
          status === 'not_attending'
            ? 'bg-red-500 text-white'
            : 'bg-white/[0.06] text-white/50 hover:bg-red-500/20 hover:text-red-400 border border-white/10'
        )}
        aria-label="Not attending"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
