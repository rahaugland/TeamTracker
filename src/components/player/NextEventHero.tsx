import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitRSVP } from '@/services/rsvp.service';
import { useAuth } from '@/store';
import type { Event, RsvpStatus } from '@/types/database.types';

interface NextEventHeroProps {
  event: Event;
  playerId: string;
  currentRsvpStatus?: RsvpStatus | string;
  onRsvpChange?: () => void;
}

export function NextEventHero({ event, playerId, currentRsvpStatus, onRsvpChange }: NextEventHeroProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | undefined>(currentRsvpStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRsvp = async (newStatus: RsvpStatus) => {
    if (!user?.id || isSubmitting) return;

    const previousStatus = status;
    setStatus(newStatus); // Optimistic
    setIsSubmitting(true);

    try {
      await submitRSVP({
        event_id: event.id,
        player_id: playerId,
        status: newStatus,
        responded_by: user.id,
      });
      onRsvpChange?.();
    } catch {
      setStatus(previousStatus); // Revert
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatch = event.type === 'game' || event.type === 'tournament';

  return (
    <div
      className={cn(
        'rounded-xl border p-5 space-y-4',
        isMatch
          ? 'bg-club-primary/[0.08] border-club-primary/20'
          : 'bg-vq-teal/[0.06] border-vq-teal/20'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-display font-semibold uppercase tracking-wider text-white/50">
            {t('playerExperience.home.nextEvent')}
          </p>
          <h3
            className="text-lg font-display font-bold uppercase tracking-wide text-white mt-1 cursor-pointer hover:text-club-primary transition-colors"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            {event.title}
          </h3>
        </div>
        {status && status !== 'pending' && (
          <span
            className={cn(
              'text-xs font-display font-bold uppercase tracking-wide px-2.5 py-1 rounded-full',
              status === 'attending' && 'bg-emerald-500/20 text-emerald-400',
              status === 'not_attending' && 'bg-red-500/20 text-red-400',
              status === 'maybe' && 'bg-yellow-500/20 text-yellow-400'
            )}
          >
            {t(`rsvp.status.${status}` as never)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(event.start_time), 'EEE, MMM d')}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {format(new Date(event.start_time), 'HH:mm')}
        </span>
        {event.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </span>
        )}
      </div>

      {/* RSVP buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleRsvp('attending')}
          disabled={isSubmitting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-display font-bold text-sm uppercase tracking-wide transition-all',
            status === 'attending'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/[0.06] text-white/80 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10'
          )}
        >
          <Check className="w-4 h-4" />
          {t('rsvp.status.attending')}
        </button>
        <button
          onClick={() => handleRsvp('not_attending')}
          disabled={isSubmitting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-display font-bold text-sm uppercase tracking-wide transition-all',
            status === 'not_attending'
              ? 'bg-red-500 text-white'
              : 'bg-white/[0.06] text-white/80 hover:bg-red-500/20 hover:text-red-400 border border-white/10'
          )}
        >
          <X className="w-4 h-4" />
          {t('rsvp.status.not_attending')}
        </button>
      </div>
    </div>
  );
}
