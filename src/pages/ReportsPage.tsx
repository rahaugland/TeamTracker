import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeams, useSeasons } from '@/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlayersRosterGrid } from '@/components/reports/PlayersRosterGrid';
import { PlayerReportCard } from '@/components/reports/PlayerReportCard';
import { GamesListView } from '@/components/reports/GamesListView';
import { PostMatchReport } from '@/components/reports/PostMatchReport';
import { ReportsTeamTab } from '@/components/reports/ReportsTeamTab';
import { ExportButton } from '@/components/reports/ExportButton';
import { exportData, type ExportFormat } from '@/services/export.service';
import { getTeamPlayerRankings } from '@/services/reports.service';
import { getTeamGameStats } from '@/services/team-stats.service';
import { useGameAnalysis } from '@/hooks/useGameAnalysis';
import type { DateRange } from '@/services/analytics.service';
import type { VolleyballPosition } from '@/types/database.types';

type ReportTab = 'players' | 'games' | 'team';

interface SelectedPlayer {
  id: string;
  name: string;
  photoUrl?: string;
  position: VolleyballPosition;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { activeTeamId } = useTeams();
  const { activeSeason } = useSeasons();
  const [activeTab, setActiveTab] = useState<ReportTab>('players');
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const dateRange: DateRange | undefined = useMemo(() => {
    if (activeSeason?.start_date && activeSeason?.end_date) {
      return {
        startDate: activeSeason.start_date,
        endDate: activeSeason.end_date,
      };
    }
    return undefined;
  }, [activeSeason?.start_date, activeSeason?.end_date]);

  // Fetch game data for prev/next navigation
  const { gameStats } = useGameAnalysis(activeTeamId ?? undefined, dateRange);

  // Compute previous/next game IDs for navigation
  const { previousGameId, nextGameId } = useMemo(() => {
    if (!selectedGameId || gameStats.length === 0) {
      return { previousGameId: null, nextGameId: null };
    }
    const idx = gameStats.findIndex((g) => g.eventId === selectedGameId);
    if (idx === -1) return { previousGameId: null, nextGameId: null };
    // gameStats is sorted most recent first, so "previous" is the next index (older) and "next" is the previous index (newer)
    return {
      previousGameId: idx < gameStats.length - 1 ? gameStats[idx + 1].eventId : null,
      nextGameId: idx > 0 ? gameStats[idx - 1].eventId : null,
    };
  }, [selectedGameId, gameStats]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ReportTab);
    setSelectedPlayer(null);
    setSelectedGameId(null);
  }, []);

  const handleNavigateGame = useCallback((eventId: string) => {
    setSelectedGameId(eventId);
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!activeTeamId) return;

      try {
        if (activeTab === 'players' && !selectedPlayer) {
          const rankings = await getTeamPlayerRankings(activeTeamId, dateRange);
          await exportData(format, {
            filename: 'player-rankings',
            title: t('reports.tabs.rankings'),
            headers: ['Rank', 'Player', 'Position', 'Rating', 'Games', 'Kill%', 'Aces/G', 'Digs/G', 'Pass Rating'],
            rows: rankings.map((r, i) => [
              i + 1,
              r.playerName,
              r.position,
              r.rating.overall,
              r.rating.gamesPlayed,
              Math.round(r.aggregated.killPercentage * 1000) / 10,
              Math.round(r.aggregated.acesPerGame * 10) / 10,
              Math.round(r.aggregated.digsPerGame * 10) / 10,
              Math.round(r.aggregated.passRating * 100) / 100,
            ]),
          });
        } else if (activeTab === 'games' && !selectedGameId) {
          const games = await getTeamGameStats(activeTeamId);
          const filtered = dateRange
            ? games.filter((g) => g.date >= dateRange.startDate && g.date <= dateRange.endDate)
            : games;
          await exportData(format, {
            filename: 'game-analysis',
            title: t('reports.tabs.games'),
            headers: ['Date', 'Opponent', 'Result', 'Sets Won', 'Sets Lost', 'Kill%', 'Serve%', 'Pass Rating'],
            rows: filtered.map((g) => [
              g.date.substring(0, 10),
              g.opponent || 'Unknown',
              g.result,
              g.setsWon,
              g.setsLost,
              Math.round(g.killPercentage * 1000) / 10,
              Math.round(g.servePercentage * 1000) / 10,
              Math.round(g.passRating * 100) / 100,
            ]),
          });
        }
        // Game detail export is handled inside PostMatchReport
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [activeTeamId, activeTab, selectedPlayer, selectedGameId, dateRange, t]
  );

  // Show export button for list views only (detail views have their own)
  const canExport =
    (activeTab === 'players' && !selectedPlayer) ||
    (activeTab === 'games' && !selectedGameId);

  if (!activeTeamId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-muted-foreground">
          {t('reports.noTeamSelected')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{t('reports.title')}</h1>
          {activeSeason && (
            <p className="text-sm text-muted-foreground mt-1">
              {activeSeason.name}
            </p>
          )}
        </div>
        {canExport && <ExportButton onExport={handleExport} />}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start overflow-x-auto mb-6">
          <TabsTrigger value="players">{t('reports.tabs.players')}</TabsTrigger>
          <TabsTrigger value="games">{t('reports.tabs.games')}</TabsTrigger>
          <TabsTrigger value="team">{t('reports.tabs.team')}</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          {selectedPlayer ? (
            <PlayerReportCard
              playerId={selectedPlayer.id}
              playerName={selectedPlayer.name}
              photoUrl={selectedPlayer.photoUrl}
              position={selectedPlayer.position}
              teamId={activeTeamId}
              dateRange={dateRange}
              onBack={() => setSelectedPlayer(null)}
            />
          ) : (
            <PlayersRosterGrid
              teamId={activeTeamId}
              dateRange={dateRange}
              onSelectPlayer={setSelectedPlayer}
            />
          )}
        </TabsContent>

        <TabsContent value="games">
          {selectedGameId ? (
            <PostMatchReport
              eventId={selectedGameId}
              teamId={activeTeamId}
              onBack={() => setSelectedGameId(null)}
              previousGameId={previousGameId}
              nextGameId={nextGameId}
              onNavigateGame={handleNavigateGame}
            />
          ) : (
            <GamesListView
              teamId={activeTeamId}
              dateRange={dateRange}
              onSelectGame={setSelectedGameId}
            />
          )}
        </TabsContent>

        <TabsContent value="team">
          <ReportsTeamTab teamId={activeTeamId} dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
