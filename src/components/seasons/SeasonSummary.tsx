import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSeasonSummary, type SeasonSummaryData } from '@/services/team-seasons.service';

interface SeasonSummaryProps {
  teamId: string;
  startDate: string;
  endDate: string;
}

export function SeasonSummary({ teamId, startDate, endDate }: SeasonSummaryProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<SeasonSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSeasonSummary(teamId, startDate, endDate)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => console.error('Error loading season summary:', err))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [teamId, startDate, endDate]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">{t('common.messages.loading')}</p>;
  }

  if (!data) return null;

  const statCards = [
    { label: t('awards.seasonSummary.record'), value: `${data.wins}W \u2014 ${data.losses}L` },
    { label: t('awards.seasonSummary.teamKillPct'), value: data.aggregatedStats.killPct != null ? `${data.aggregatedStats.killPct.toFixed(1)}%` : '\u2014' },
    { label: t('awards.seasonSummary.teamServePct'), value: data.aggregatedStats.servePct != null ? `${data.aggregatedStats.servePct.toFixed(1)}%` : '\u2014' },
    { label: t('awards.seasonSummary.avgAttendance'), value: `${data.avgAttendanceRate.toFixed(0)}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-lg font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {data.recentMatches.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold mb-2">{t('awards.seasonSummary.recentMatches')}</h4>
          <div className="space-y-1.5">
            {data.recentMatches.map((match) => (
              <div key={match.eventId} className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5">
                <span className="truncate mr-2">{match.opponent || '\u2014'}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground">{match.setsWon}\u2013{match.setsLost}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${match.won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {match.won ? t('awards.seasonSummary.win') : t('awards.seasonSummary.loss')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t('awards.seasonSummary.noMatches')}
        </p>
      )}
    </div>
  );
}
