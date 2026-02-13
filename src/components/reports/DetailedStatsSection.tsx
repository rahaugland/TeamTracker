import { useTranslation } from 'react-i18next';
import { Swords, Target, Shield, Circle, Hand, Pointer, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STAT_CATEGORIES, type StatCategory } from '@/components/match-stats/stat-categories';
import type { PlayerStatLine, TeamTotals } from '@/hooks/usePostMatchReport';
import type { PlayerStatRow } from '@/components/match-stats/types';

interface DetailedStatsSectionProps {
  playerStatLines: PlayerStatLine[];
  teamTotals: TeamTotals;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Swords,
  Target,
  Shield,
  Circle,
  Hand,
  Pointer,
};

const STATUS_COLORS: Record<string, string> = {
  good: 'text-green-400',
  average: 'text-yellow-400',
  poor: 'text-red-400',
  neutral: 'text-foreground',
};

/** Convert a PlayerStatLine to the PlayerStatRow shape expected by stat-categories */
function toStatRow(p: PlayerStatLine): PlayerStatRow {
  return {
    playerId: p.playerId,
    playerName: p.playerName,
    kills: p.kills,
    attackErrors: p.attackErrors,
    attackAttempts: p.attackAttempts,
    aces: p.aces,
    serviceErrors: p.serviceErrors,
    serveAttempts: p.serveAttempts,
    digs: p.digs,
    blockSolos: p.blockSolos,
    blockAssists: p.blockAssists,
    blockTouches: p.blockTouches,
    ballHandlingErrors: p.ballHandlingErrors,
    passAttempts: p.passAttempts,
    passSum: p.passSum,
    setAttempts: p.setAttempts,
    setSum: p.setSum,
    settingErrors: p.settingErrors,
    setsPlayed: p.setsPlayed,
    rotationsPlayed: p.rotationsPlayed,
    rotation: p.rotation,
  };
}

function buildTotalsRow(totals: TeamTotals): PlayerStatRow {
  return {
    playerId: '__totals__',
    playerName: '',
    kills: totals.kills,
    attackErrors: totals.attackErrors,
    attackAttempts: totals.attackAttempts,
    aces: totals.aces,
    serviceErrors: totals.serviceErrors,
    serveAttempts: totals.serveAttempts,
    digs: totals.digs,
    blockSolos: totals.blockSolos,
    blockAssists: totals.blockAssists,
    blockTouches: totals.blockTouches,
    ballHandlingErrors: totals.ballHandlingErrors,
    passAttempts: totals.passAttempts,
    passSum: totals.passSum,
    setAttempts: totals.setAttempts,
    setSum: totals.setSum,
    settingErrors: totals.settingErrors,
    setsPlayed: 0,
    rotationsPlayed: 0,
    rotation: null,
  };
}

function CategoryCard({
  category,
  players,
  totalsRow,
  totalsLabel,
}: {
  category: StatCategory;
  players: PlayerStatRow[];
  totalsRow: PlayerStatRow;
  totalsLabel: string;
}) {
  const Icon = ICON_MAP[category.icon];

  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: category.color }} />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {Icon && <Icon className="w-4 h-4" style={{ color: category.color }} />}
          {category.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">Player</TableHead>
                {category.stats.map((s) => (
                  <TableHead key={s.field} className="text-center whitespace-nowrap">
                    {s.shortLabel}
                  </TableHead>
                ))}
                {category.calculated && (
                  <TableHead className="text-center whitespace-nowrap">
                    {category.calculated.label}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => {
                const status = category.calculated?.getStatus?.(p) ?? 'neutral';
                return (
                  <TableRow key={p.playerId}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm truncate max-w-[140px]">
                      {p.playerName}
                    </TableCell>
                    {category.stats.map((s) => (
                      <TableCell key={s.field} className="text-center font-mono text-sm">
                        {p[s.field] as number}
                      </TableCell>
                    ))}
                    {category.calculated && (
                      <TableCell className={`text-center font-mono text-sm font-semibold ${STATUS_COLORS[status]}`}>
                        {category.calculated.compute(p)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {/* Team Totals Row */}
              <TableRow className="border-t-2 font-semibold bg-muted/30">
                <TableCell className="sticky left-0 bg-muted/30 z-10 text-sm">
                  {totalsLabel}
                </TableCell>
                {category.stats.map((s) => (
                  <TableCell key={s.field} className="text-center font-mono text-sm">
                    {totalsRow[s.field] as number}
                  </TableCell>
                ))}
                {category.calculated && (
                  <TableCell className="text-center font-mono text-sm font-semibold">
                    {category.calculated.compute(totalsRow)}
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DetailedStatsSection({ playerStatLines, teamTotals }: DetailedStatsSectionProps) {
  const { t } = useTranslation();
  const players = playerStatLines.map(toStatRow);
  const totalsRow = buildTotalsRow(teamTotals);
  const totalsLabel = t('reports.postMatch.teamTotals');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {STAT_CATEGORIES.map((cat) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          players={players}
          totalsRow={totalsRow}
          totalsLabel={totalsLabel}
        />
      ))}

      {/* Playing Time Card */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gray-500" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            {t('reports.postMatch.playingTime')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">Player</TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    {t('reports.postMatch.setsPlayed')}
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    {t('reports.postMatch.rotationsPlayed')}
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    {t('reports.postMatch.startingRotation')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playerStatLines.map((p) => (
                  <TableRow key={p.playerId}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm truncate max-w-[140px]">
                      {p.playerName}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">{p.setsPlayed}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{p.rotationsPlayed}</TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {p.rotation != null ? p.rotation : '\u2014'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
