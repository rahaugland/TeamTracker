import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { getRSVPSummary } from '@/services/rsvp.service';
import type { Event } from '@/types/database.types';

interface NextMatchExpansionPanelProps {
  nextMatch: Event | null;
  upcomingEvents: Event[];
}

export function NextMatchExpansionPanel({ nextMatch, upcomingEvents }: NextMatchExpansionPanelProps) {
  const navigate = useNavigate();
  const [rsvp, setRsvp] = useState<{ attending: number; not_attending: number; pending: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!nextMatch) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const summary = await getRSVPSummary(nextMatch!.id);
        if (!cancelled) {
          setRsvp({
            attending: summary.attending,
            not_attending: summary.not_attending,
            pending: summary.pending + summary.maybe,
            total: summary.total,
          });
        }
      } catch (err) {
        console.error('Failed to load RSVP data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [nextMatch]);

  if (!nextMatch) {
    return (
      <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
        <div className="text-center py-8">
          <p className="text-gray-400">No upcoming matches scheduled</p>
        </div>
      </div>
    );
  }

  // Next 3 matches after the current nextMatch
  const upcomingMatches = upcomingEvents
    .filter(e => (e.type === 'game' || e.type === 'tournament') && e.id !== nextMatch.id)
    .slice(0, 3);

  const matchDate = parseISO(nextMatch.start_time);
  const rsvpTotal = rsvp ? rsvp.attending + rsvp.not_attending + rsvp.pending : 0;

  return (
    <div className="p-6 mb-4 rounded-lg bg-navy-90 border border-white/[0.06]">
      <h3 className="font-display font-bold text-sm uppercase tracking-wide text-white mb-6">
        Match Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Match details + RSVP */}
        <div className="space-y-5">
          <div
            className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:border-vq-teal/30 transition-colors"
            onClick={() => navigate(`/events/${nextMatch.id}`)}
          >
            {nextMatch.opponent && (
              <p className="font-display font-bold text-lg text-white mb-3">
                vs {nextMatch.opponent}
              </p>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{format(matchDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{format(matchDate, 'HH:mm')}</span>
              </div>
              {nextMatch.location && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{nextMatch.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* RSVP Breakdown */}
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-6 bg-white/[0.06] rounded animate-pulse" />
            </div>
          ) : rsvp && rsvpTotal > 0 ? (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">RSVP Status</p>
              {/* Stacked progress bar */}
              <div className="h-3 rounded-full overflow-hidden flex bg-navy-70 mb-3">
                {rsvp.attending > 0 && (
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(rsvp.attending / rsvpTotal) * 100}%` }}
                  />
                )}
                {rsvp.not_attending > 0 && (
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(rsvp.not_attending / rsvpTotal) * 100}%` }}
                  />
                )}
                {rsvp.pending > 0 && (
                  <div
                    className="h-full bg-gray-500 transition-all"
                    style={{ width: `${(rsvp.pending / rsvpTotal) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-500">
                  <span className="font-mono font-bold">{rsvp.attending}</span> attending
                </span>
                <span className="text-red-500">
                  <span className="font-mono font-bold">{rsvp.not_attending}</span> unavailable
                </span>
                <span className="text-gray-400">
                  <span className="font-mono font-bold">{rsvp.pending}</span> pending
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Upcoming matches */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Upcoming Matches</p>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-2">
              {upcomingMatches.map(match => {
                const date = parseISO(match.start_time);
                return (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 p-3 rounded bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors"
                    onClick={() => navigate(`/events/${match.id}`)}
                  >
                    <div className="text-center shrink-0 w-10">
                      <p className="font-mono text-xs text-gray-400">{format(date, 'MMM')}</p>
                      <p className="font-mono text-lg font-bold text-white leading-none">{format(date, 'dd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {match.opponent ? `vs ${match.opponent}` : match.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {match.location || 'TBD'} • {format(date, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              No more matches scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
