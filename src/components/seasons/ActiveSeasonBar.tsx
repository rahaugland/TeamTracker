import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTeamSeasons, getSeasonSummary, type SeasonSummaryData } from '@/services/team-seasons.service';
import type { TeamSeason } from '@/types/database.types';
import { CalendarDays, ChevronRight } from 'lucide-react';

interface ActiveSeasonBarProps {
  teamId: string;
}

export function ActiveSeasonBar({ teamId }: ActiveSeasonBarProps) {
  const { t } = useTranslation();
  const [season, setSeason] = useState<TeamSeason | null>(null);
  const [summary, setSummary] = useState<SeasonSummaryData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const seasons = await getTeamSeasons(teamId);
        if (cancelled || seasons.length === 0) return;

        // Pick active (non-finalized) season, or most recent
        const active = seasons.find((s) => !s.is_finalized) ?? seasons[0];
        setSeason(active);

        const data = await getSeasonSummary(teamId, active.start_date, active.end_date);
        if (!cancelled) setSummary(data);
      } catch (err) {
        console.error('Error loading active season:', err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [teamId]);

  if (!season) return null;

  const totalGames = (summary?.wins ?? 0) + (summary?.losses ?? 0);

  return (
    <Link
      to={`/teams/${teamId}/seasons`}
      className="block bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-6 hover:bg-primary/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <CalendarDays className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {t('awards.activeSeason.label')}
              </span>
              <span className="font-semibold truncate">{season.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(season.start_date).toLocaleDateString()} – {new Date(season.end_date).toLocaleDateString()}
              {summary && (
                <span className="ml-2">
                  · {summary.wins}W – {summary.losses}L
                  {totalGames > 0 && ` · ${t('awards.activeSeason.games', { count: totalGames })}`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary shrink-0 ml-2">
          <span className="hidden sm:inline">{t('awards.activeSeason.viewDetails')}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
