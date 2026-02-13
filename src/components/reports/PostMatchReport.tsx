import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExportButton } from '@/components/reports/ExportButton';
import { exportData, type ExportFormat } from '@/services/export.service';
import { usePostMatchReport } from '@/hooks/usePostMatchReport';
import { DetailedStatsSection } from '@/components/reports/DetailedStatsSection';
import type { GameAwardType } from '@/types/database.types';

interface PostMatchReportProps {
  eventId: string;
  teamId: string;
  onBack: () => void;
}

const AWARD_KEYS = {
  mvp: 'reports.postMatch.mvp',
  top_attacker: 'reports.postMatch.topAttacker',
  top_server: 'reports.postMatch.topServer',
  top_defender: 'reports.postMatch.topDefender',
  top_passer: 'reports.postMatch.topPasser',
} as const;

export function PostMatchReport({ eventId, teamId, onBack }: PostMatchReportProps) {
  const { t } = useTranslation();
  const [showDetailed, setShowDetailed] = useState(false);
  const { event, teamTotals, playerStatLines, awards, playerMap, keyTakeaways, isLoading, error } =
    usePostMatchReport(eventId, teamId);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!event || playerStatLines.length === 0) return;
      await exportData(format, {
        filename: `match-report-${event.opponent ?? 'game'}`,
        title: `${t('reports.postMatch.vs')} ${event.opponent ?? 'Unknown'} — ${new Date(event.start_time).toLocaleDateString()}`,
        headers: [
          t('reports.postMatch.player'),
          t('reports.postMatch.kills'),
          t('reports.postMatch.errors'),
          t('reports.postMatch.attempts'),
          t('reports.postMatch.killPct'),
          t('reports.postMatch.aces'),
          t('reports.postMatch.digs'),
          t('reports.postMatch.blocks'),
        ],
        rows: playerStatLines.map((p) => [
          p.playerName,
          p.kills,
          p.attackErrors,
          p.attackAttempts,
          `${Math.round(p.killPct * 1000) / 10}%`,
          p.aces,
          p.digs,
          p.blockSolos + p.blockAssists,
        ]),
      });
    },
    [event, playerStatLines, t]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 w-40 bg-muted rounded" />
        <div className="animate-pulse h-32 bg-muted rounded-lg" />
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('reports.postMatch.back')}
        </Button>
        <div className="text-center py-16 text-muted-foreground">
          {error ?? t('reports.postMatch.noStats')}
        </div>
      </div>
    );
  }

  const won = (event.sets_won ?? 0) > (event.sets_lost ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            {t('reports.postMatch.back')}
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-muted-foreground">
              {t('reports.postMatch.vs')}
            </h2>
            <h2 className="text-xl font-bold">{event.opponent ?? 'Unknown'}</h2>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-4xl font-bold">
              {event.sets_won ?? 0}-{event.sets_lost ?? 0}
            </span>
            <Badge
              variant={won ? 'default' : 'destructive'}
              className={
                won
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }
            >
              {won ? t('reports.postMatch.won') : t('reports.postMatch.lost')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(event.start_time).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Set Scores */}
      {event.set_scores && event.set_scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.setScores')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {event.set_scores.map((set, i) => {
                if (!Array.isArray(set) || set.length < 2) return null;
                const [our, their] = set;
                const setWon = our > their;
                return (
                  <div
                    key={i}
                    className={`px-4 py-2 rounded-lg border-2 font-mono text-lg font-bold ${
                      setWon
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-red-500/40 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {our}-{their}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Stats */}
      {teamTotals && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.keyStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label={t('reports.playerReport.killPct')}
                value={`${Math.round(teamTotals.killPct * 1000) / 10}%`}
                accent="teal"
              />
              <StatCard
                label="Serve %"
                value={`${Math.round(teamTotals.servePct * 1000) / 10}%`}
                accent="primary"
              />
              <StatCard
                label={t('reports.playerReport.passRating')}
                value={Math.round(teamTotals.passRating * 100) / 100}
                accent="success"
              />
              <StatCard
                label={t('reports.playerReport.kills')}
                value={teamTotals.kills}
                accent="secondary"
              />
              <StatCard
                label={t('reports.playerReport.aces')}
                value={teamTotals.aces}
                accent="teal"
              />
              <StatCard
                label={t('reports.playerReport.digs')}
                value={teamTotals.digs}
                accent="success"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {awards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.topPerformers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {awards.slice(0, 4).map((award) => {
                const info = playerMap.get(award.player_id);
                return (
                  <div
                    key={award.award_type}
                    className="bg-navy-80 rounded-lg p-4 text-center border border-white/[0.06]"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      {t(AWARD_KEYS[award.award_type])}
                    </p>
                    <p className="font-medium text-sm truncate">
                      {info?.name ?? 'Unknown'}
                    </p>
                    {'award_value' in award && award.award_value != null && (
                      <p className="font-mono text-lg font-bold text-vq-teal mt-1">
                        {typeof award.award_value === 'number'
                          ? Math.round(award.award_value * 10) / 10
                          : award.award_value}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Stat Lines */}
      {playerStatLines.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.playerStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.postMatch.player')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.kills')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.errors')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.attempts')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.killPct')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.aces')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.digs')}</TableHead>
                  <TableHead className="text-center">{t('reports.postMatch.blocks')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playerStatLines.map((p) => (
                  <TableRow
                    key={p.playerId}
                    className={p.isMvp ? 'bg-vq-teal/5' : undefined}
                  >
                    <TableCell className="font-medium">
                      {p.playerName}
                      {p.isMvp && (
                        <Badge variant="outline" className="ml-2 text-xs text-vq-teal border-vq-teal/30">
                          MVP
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">{p.kills}</TableCell>
                    <TableCell className="text-center font-mono">{p.attackErrors}</TableCell>
                    <TableCell className="text-center font-mono">{p.attackAttempts}</TableCell>
                    <TableCell className="text-center font-mono">
                      {Math.round(p.killPct * 1000) / 10}%
                    </TableCell>
                    <TableCell className="text-center font-mono">{p.aces}</TableCell>
                    <TableCell className="text-center font-mono">{p.digs}</TableCell>
                    <TableCell className="text-center font-mono">
                      {p.blockSolos + p.blockAssists}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {t('reports.postMatch.noStats')}
        </div>
      )}

      {/* Detailed Stats Toggle */}
      {playerStatLines.length > 0 && teamTotals && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailed((v) => !v)}
            className="w-full gap-2"
          >
            {showDetailed ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t('reports.postMatch.hideDetailedStats')}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t('reports.postMatch.showDetailedStats')}
              </>
            )}
          </Button>
          {showDetailed && (
            <DetailedStatsSection
              playerStatLines={playerStatLines}
              teamTotals={teamTotals}
              eventName={event.opponent ?? 'game'}
            />
          )}
        </>
      )}

      {/* Key Takeaways */}
      {keyTakeaways.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.keyTakeaways')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-vq-teal mt-0.5">&#8226;</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
