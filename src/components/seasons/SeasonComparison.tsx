import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSeasonSummary, type SeasonSummaryData } from '@/services/team-seasons.service';
import type { TeamSeason } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SeasonComparisonProps {
  teamId: string;
  seasons: TeamSeason[];
}

interface StatRow {
  label: string;
  a: string;
  b: string;
  aVal: number | null;
  bVal: number | null;
  higherIsBetter: boolean;
}

export function SeasonComparison({ teamId, seasons }: SeasonComparisonProps) {
  const { t } = useTranslation();
  const [seasonAId, setSeasonAId] = useState<string>('');
  const [seasonBId, setSeasonBId] = useState<string>('');
  const [summaryA, setSummaryA] = useState<SeasonSummaryData | null>(null);
  const [summaryB, setSummaryB] = useState<SeasonSummaryData | null>(null);

  const seasonA = seasons.find((s) => s.id === seasonAId);
  const seasonB = seasons.find((s) => s.id === seasonBId);

  useEffect(() => {
    if (!seasonA) { setSummaryA(null); return; }
    let cancelled = false;
    getSeasonSummary(teamId, seasonA.start_date, seasonA.end_date)
      .then((d) => { if (!cancelled) setSummaryA(d); })
      .catch(() => setSummaryA(null));
    return () => { cancelled = true; };
  }, [teamId, seasonAId]);

  useEffect(() => {
    if (!seasonB) { setSummaryB(null); return; }
    let cancelled = false;
    getSeasonSummary(teamId, seasonB.start_date, seasonB.end_date)
      .then((d) => { if (!cancelled) setSummaryB(d); })
      .catch(() => setSummaryB(null));
    return () => { cancelled = true; };
  }, [teamId, seasonBId]);

  const stats: StatRow[] = summaryA && summaryB ? [
    {
      label: t('awards.seasonSummary.record'),
      a: `${summaryA.wins}W – ${summaryA.losses}L`,
      b: `${summaryB.wins}W – ${summaryB.losses}L`,
      aVal: (summaryA.wins + summaryA.losses) > 0 ? summaryA.wins / (summaryA.wins + summaryA.losses) * 100 : null,
      bVal: (summaryB.wins + summaryB.losses) > 0 ? summaryB.wins / (summaryB.wins + summaryB.losses) * 100 : null,
      higherIsBetter: true,
    },
    {
      label: t('awards.seasonSummary.teamKillPct'),
      a: summaryA.aggregatedStats.killPct != null ? `${summaryA.aggregatedStats.killPct.toFixed(1)}%` : '—',
      b: summaryB.aggregatedStats.killPct != null ? `${summaryB.aggregatedStats.killPct.toFixed(1)}%` : '—',
      aVal: summaryA.aggregatedStats.killPct,
      bVal: summaryB.aggregatedStats.killPct,
      higherIsBetter: true,
    },
    {
      label: t('awards.seasonSummary.teamServePct'),
      a: summaryA.aggregatedStats.servePct != null ? `${summaryA.aggregatedStats.servePct.toFixed(1)}%` : '—',
      b: summaryB.aggregatedStats.servePct != null ? `${summaryB.aggregatedStats.servePct.toFixed(1)}%` : '—',
      aVal: summaryA.aggregatedStats.servePct,
      bVal: summaryB.aggregatedStats.servePct,
      higherIsBetter: true,
    },
    {
      label: t('awards.seasonSummary.avgAttendance'),
      a: `${summaryA.avgAttendanceRate.toFixed(0)}%`,
      b: `${summaryB.avgAttendanceRate.toFixed(0)}%`,
      aVal: summaryA.avgAttendanceRate,
      bVal: summaryB.avgAttendanceRate,
      higherIsBetter: true,
    },
  ] : [];

  function delta(aVal: number | null, bVal: number | null): string | null {
    if (aVal == null || bVal == null) return null;
    const diff = aVal - bVal;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('awards.seasonComparison.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('awards.seasonComparison.seasonA')}
            </label>
            <Select value={seasonAId} onValueChange={setSeasonAId}>
              <SelectTrigger>
                <SelectValue placeholder={t('awards.seasonComparison.selectSeason')} />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('awards.seasonComparison.seasonB')}
            </label>
            <Select value={seasonBId} onValueChange={setSeasonBId}>
              <SelectTrigger>
                <SelectValue placeholder={t('awards.seasonComparison.selectSeason')} />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="space-y-2">
            {stats.map((row) => {
              const aBetter = row.aVal != null && row.bVal != null && (row.higherIsBetter ? row.aVal > row.bVal : row.aVal < row.bVal);
              const bBetter = row.aVal != null && row.bVal != null && (row.higherIsBetter ? row.bVal > row.aVal : row.bVal < row.aVal);
              const d = delta(row.aVal, row.bVal);

              return (
                <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center rounded-lg border p-3">
                  <div className={cn('text-right font-semibold', aBetter && 'text-emerald-400')}>
                    {row.a}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    {d && <p className="text-xs font-medium text-muted-foreground">{t('awards.seasonComparison.delta', { value: d })}</p>}
                  </div>
                  <div className={cn('font-semibold', bBetter && 'text-emerald-400')}>
                    {row.b}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('awards.seasonComparison.empty')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
