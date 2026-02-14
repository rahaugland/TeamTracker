import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Download, MapPin, Calendar, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PlayerAvatar } from '@/components/player/PlayerAvatar';
import { exportData, type ExportFormat } from '@/services/export.service';
import { usePostMatchReport, type PlayerStatLine } from '@/hooks/usePostMatchReport';
import { DetailedStatsSection } from '@/components/reports/DetailedStatsSection';
import { useTeams } from '@/store';
import type { GameAwardType } from '@/types/database.types';

interface PostMatchReportProps {
  eventId: string;
  teamId: string;
  onBack: () => void;
  previousGameId?: string | null;
  nextGameId?: string | null;
  onNavigateGame?: (eventId: string) => void;
}

const AWARD_KEYS = {
  mvp: 'reports.postMatch.mvp',
  top_attacker: 'reports.postMatch.topAttacker',
  top_server: 'reports.postMatch.topServer',
  top_defender: 'reports.postMatch.topDefender',
  top_passer: 'reports.postMatch.topPasser',
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function exportPlayerStats(format: ExportFormat, p: PlayerStatLine, eventName: string) {
  const killPct = p.attackAttempts > 0
    ? `${((p.kills - p.attackErrors) / p.attackAttempts * 100).toFixed(1)}%`
    : '\u2014';
  const acePct = p.serveAttempts > 0
    ? `${((p.aces / p.serveAttempts) * 100).toFixed(1)}%`
    : '\u2014';
  const passRating = p.passAttempts > 0
    ? (p.passSum / p.passAttempts).toFixed(2)
    : '\u2014';
  const setRating = p.setAttempts > 0
    ? (p.setSum / p.setAttempts).toFixed(2)
    : '\u2014';
  const totalBlocks = (p.blockSolos + p.blockAssists * 0.5).toFixed(1);

  exportData(format, {
    filename: `${eventName}-${p.playerName.replace(/\s+/g, '-').toLowerCase()}`,
    title: `${p.playerName} \u2014 ${eventName}`,
    headers: ['Category', 'Stat', 'Value'],
    rows: [
      ['Attack', 'Kills', p.kills],
      ['Attack', 'Errors', p.attackErrors],
      ['Attack', 'Attempts', p.attackAttempts],
      ['Attack', 'Kill %', killPct],
      ['Serve', 'Aces', p.aces],
      ['Serve', 'Errors', p.serviceErrors],
      ['Serve', 'Attempts', p.serveAttempts],
      ['Serve', 'Ace %', acePct],
      ['Block', 'Solos', p.blockSolos],
      ['Block', 'Assists', p.blockAssists],
      ['Block', 'Touches', p.blockTouches],
      ['Block', 'Total', totalBlocks],
      ['Defense', 'Digs', p.digs],
      ['Defense', 'Ball Handling Errors', p.ballHandlingErrors],
      ['Passing', 'Attempts', p.passAttempts],
      ['Passing', 'Sum', p.passSum],
      ['Passing', 'Rating', passRating],
      ['Setting', 'Attempts', p.setAttempts],
      ['Setting', 'Sum', p.setSum],
      ['Setting', 'Errors', p.settingErrors],
      ['Setting', 'Rating', setRating],
      ['Playing Time', 'Sets Played', p.setsPlayed],
      ['Playing Time', 'Rotations', p.rotationsPlayed],
      ['Playing Time', 'Starting Rotation', p.rotation ?? '\u2014'],
      ['Rating', 'Game Rating', p.gameRating],
    ],
  });
}

function formatTrendDelta(current: number, avg: number, isPercentage: boolean, vsAvgLabel: string): { text: string; type: 'positive' | 'negative' | 'neutral' } {
  const diff = current - avg;
  const absDiff = Math.abs(diff);
  const formatted = isPercentage
    ? `${(absDiff * 100).toFixed(1)}%`
    : absDiff.toFixed(2);

  if (Math.abs(diff) < 0.005) {
    return { text: `\u2192 ${vsAvgLabel}`, type: 'neutral' };
  }
  if (diff > 0) {
    return { text: `\u2191 +${formatted} ${vsAvgLabel}`, type: 'positive' };
  }
  return { text: `\u2193 -${formatted} ${vsAvgLabel}`, type: 'negative' };
}

export function PostMatchReport({ eventId, teamId, onBack, previousGameId, nextGameId, onNavigateGame }: PostMatchReportProps) {
  const { t } = useTranslation();
  const { getActiveTeam } = useTeams();
  const activeTeam = getActiveTeam();
  const [showDetailed, setShowDetailed] = useState(false);
  const { event, teamTotals, seasonAverages, playerStatLines, awards, playerMap, categorizedTakeaways, isLoading, error } =
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
          t('reports.postMatch.rating'),
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
          p.gameRating,
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
  const teamName = activeTeam?.name ?? 'Team';

  // Find MVP award and player info
  const mvpAward = awards.find((a) => a.award_type === 'mvp');
  const mvpPlayerInfo = mvpAward ? playerMap.get(mvpAward.player_id) : null;
  const nonMvpAwards = awards.filter((a) => a.award_type !== 'mvp').slice(0, 3);

  // Categorize takeaways
  const positiveTakeaways = categorizedTakeaways.filter((t) => t.category === 'positive');
  const improvementTakeaways = categorizedTakeaways.filter((t) => t.category === 'improvement');
  const milestoneTakeaways = categorizedTakeaways.filter((t) => t.category === 'milestone');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        {t('reports.postMatch.back')}
      </Button>

      {/* Centered Match Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-4 text-lg font-semibold">
          <span className="uppercase tracking-wide">{teamName}</span>
          <span className="text-muted-foreground">{t('reports.postMatch.vs')}</span>
          <span className="uppercase tracking-wide">{event.opponent ?? 'Unknown'}</span>
          {event.opponent_tier != null && (
            <span className="text-xs text-muted-foreground font-normal tabular-nums">
              T{event.opponent_tier}
            </span>
          )}
        </div>
        <div className="font-mono text-5xl font-bold tracking-tight">
          {event.sets_won ?? 0} : {event.sets_lost ?? 0}
        </div>
        <Badge
          className={
            won
              ? 'bg-green-500/20 text-green-400 border-green-500/30 text-sm px-4 py-1 uppercase font-bold tracking-wider'
              : 'bg-red-500/20 text-red-400 border-red-500/30 text-sm px-4 py-1 uppercase font-bold tracking-wider'
          }
        >
          {won ? t('reports.postMatch.victory') : t('reports.postMatch.defeat')}
        </Badge>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(event.start_time).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Set Score Cards */}
      {event.set_scores && event.set_scores.length > 0 && (
        <div className="flex justify-center gap-3">
          {event.set_scores.map((set, i) => {
            if (!Array.isArray(set) || set.length < 2) return null;
            const [our, their] = set;
            const setWon = our > their;
            return (
              <div
                key={i}
                className="relative bg-navy-90 border border-white/[0.06] rounded-lg p-4 text-center overflow-hidden flex-1 max-w-[140px]"
              >
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${setWon ? 'bg-vq-teal' : 'bg-red-500'}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Set {i + 1}
                </p>
                <p className="font-mono text-2xl font-bold">
                  {our} : {their}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Stats with Trend Indicators */}
      {teamTotals && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.keyStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(() => {
                const vsAvgLabel = t('reports.postMatch.vsAvg');
                const killTrend = seasonAverages ? formatTrendDelta(teamTotals.killPct, seasonAverages.killPct, true, vsAvgLabel) : null;
                const serveTrend = seasonAverages ? formatTrendDelta(teamTotals.servePct, seasonAverages.servePct, true, vsAvgLabel) : null;
                const passTrend = seasonAverages ? formatTrendDelta(teamTotals.passRating, seasonAverages.passRating, false, vsAvgLabel) : null;
                return (
                  <>
                    <StatCard
                      label={t('reports.playerReport.killPct')}
                      value={`${Math.round(teamTotals.killPct * 1000) / 10}%`}
                      accent="teal"
                      delta={killTrend?.text}
                      deltaType={killTrend?.type}
                    />
                    <StatCard
                      label="Serve %"
                      value={`${Math.round(teamTotals.servePct * 1000) / 10}%`}
                      accent="primary"
                      delta={serveTrend?.text}
                      deltaType={serveTrend?.type}
                    />
                    <StatCard
                      label={t('reports.playerReport.passRating')}
                      value={Math.round(teamTotals.passRating * 100) / 100}
                      accent="success"
                      delta={passTrend?.text}
                      deltaType={passTrend?.type}
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
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MVP Card */}
      {mvpAward && mvpPlayerInfo && (
        <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-5 border-l-4 border-l-vq-teal">
          <div className="flex items-center gap-4">
            <PlayerAvatar
              initials={getInitials(mvpPlayerInfo.name)}
              imageUrl={mvpPlayerInfo.photo_url}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-vq-teal" />
                <span className="text-xs font-semibold uppercase tracking-wider text-vq-teal">
                  {t('reports.postMatch.mvp')}
                </span>
              </div>
              <p className="text-lg font-bold truncate">{mvpPlayerInfo.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {mvpPlayerInfo.positions?.[0] && (
                  <span className="capitalize">{mvpPlayerInfo.positions[0].replace(/_/g, ' ')}</span>
                )}
                {mvpPlayerInfo.jerseyNumber != null && (
                  <span>#{mvpPlayerInfo.jerseyNumber}</span>
                )}
              </div>
            </div>
            {'award_value' in mvpAward && mvpAward.award_value != null && (
              <div className="text-right">
                <p className="font-mono text-3xl font-bold text-vq-teal">
                  {typeof mvpAward.award_value === 'number'
                    ? Math.round(mvpAward.award_value * 10) / 10
                    : mvpAward.award_value}
                </p>
                <p className="text-xs text-muted-foreground">MVP Score</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Performers (non-MVP) */}
      {nonMvpAwards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.postMatch.topPerformers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nonMvpAwards.map((award) => {
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
                  <TableHead className="text-center">{t('reports.postMatch.rating')}</TableHead>
                  <TableHead className="w-10" />
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
                    <TableCell className="text-center font-mono font-semibold">
                      <span className={
                        p.gameRating >= 70 ? 'text-emerald-400' :
                        p.gameRating >= 40 ? 'text-amber-400' :
                        'text-muted-foreground'
                      }>
                        {p.gameRating}
                      </span>
                    </TableCell>
                    <TableCell className="p-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportPlayerStats('csv', p, event.opponent ?? 'game')}>
                            {t('reports.export.csv')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportPlayerStats('excel', p, event.opponent ?? 'game')}>
                            {t('reports.export.excel')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportPlayerStats('pdf', p, event.opponent ?? 'game')}>
                            {t('reports.export.pdf')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Categorized Takeaways */}
      {categorizedTakeaways.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* What Went Well */}
          {positiveTakeaways.length > 0 && (
            <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-5 border-l-4 border-l-green-500">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-3">
                {t('reports.postMatch.whatWentWell')}
              </h4>
              <ul className="space-y-2">
                {positiveTakeaways.map((tw, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">&#8226;</span>
                    <span>{tw.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to Address */}
          {improvementTakeaways.length > 0 && (
            <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-5 border-l-4 border-l-yellow-500">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-3">
                {t('reports.postMatch.areasToAddress')}
              </h4>
              <ul className="space-y-2">
                {improvementTakeaways.map((tw, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-400 mt-0.5">&#8226;</span>
                    <span>{tw.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notable Milestones */}
          {milestoneTakeaways.length > 0 && (
            <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-5 border-l-4 border-l-blue-500">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
                {t('reports.postMatch.notableMilestones')}
              </h4>
              <ul className="space-y-2">
                {milestoneTakeaways.map((tw, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-400 mt-0.5">&#8226;</span>
                    <span>{tw.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={!previousGameId}
          onClick={() => previousGameId && onNavigateGame?.(previousGameId)}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('reports.postMatch.previousGame')}
        </Button>

        <ExportButton onExport={handleExport} />

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={!nextGameId}
          onClick={() => nextGameId && onNavigateGame?.(nextGameId)}
        >
          {t('reports.postMatch.nextGame')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
