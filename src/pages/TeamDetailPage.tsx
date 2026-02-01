import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useUI } from '@/store';
import { getTeam } from '@/services/teams.service';
import { getPlayersByTeam, getPendingPlayersByTeam } from '@/services/players.service';
import { getPlayerAttendanceRates } from '@/services/analytics.service';
import { getPlayerStats, calculatePlayerRating } from '@/services/player-stats.service';
import { useTeamStats } from '@/hooks/useTeamStats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import type { TeamWithDetails } from '@/services/teams.service';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { PlayerRating } from '@/services/player-stats.service';

// Dashboard components
import { TeamHeader } from '@/components/team/TeamHeader';
import { SquadRoster } from '@/components/team/SquadRoster';
import { TeamGameLog } from '@/components/team/TeamGameLog';
import { TeamPerformanceTrends } from '@/components/team/TeamPerformanceTrends';
import { AttendanceLeaderboard } from '@/components/team/AttendanceLeaderboard';
import { TeamRatingRadar } from '@/components/team/TeamRatingRadar';
import { BestXIFormation } from '@/components/team/BestXIFormation';
import { PlayerComparison } from '@/components/team/PlayerComparison';
import { PendingPlayers } from '@/components/team/PendingPlayers';
import { usePermissions } from '@/hooks/usePermissions';

interface PlayerWithRating extends PlayerWithMemberships {
  rating?: number;
  ratingData?: PlayerRating;
  jerseyNumber?: number;
}

/**
 * TeamDetailPage
 * Comprehensive team dashboard with tabs for different views
 */
export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useUI();
  const { user } = useAuth();
  const isPlayer = user?.role === 'player';

  const { isCoach } = usePermissions();
  const [team, setTeam] = useState<TeamWithDetails | null>(null);
  const [players, setPlayers] = useState<PlayerWithRating[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<PlayerWithMemberships[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [attendanceRates, setAttendanceRates] = useState<any[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Use team stats hook
  const {
    teamRating,
    gameStats,
    bestXI,
    formStreak,
    isLoading: isLoadingTeamStats,
  } = useTeamStats({ teamId: id || '' });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const teamData = await getTeam(id);
        if (cancelled) return;
        setTeam(teamData);

        setIsLoadingPlayers(true);
        const [playersData, pendingData] = await Promise.all([
          getPlayersByTeam(id),
          getPendingPlayersByTeam(id).catch(() => []),
        ]);
        if (cancelled) return;
        setPendingPlayers(pendingData);

        const attendance = await getPlayerAttendanceRates(id);
        if (cancelled) return;
        setAttendanceRates(attendance);

        const playersWithRatings = await Promise.all(
          playersData.map(async (player) => {
            const primaryPosition = player.positions?.[0] || 'all_around';
            const statEntries = await getPlayerStats(player.id, 'career', undefined, id);

            let rating: number | undefined;
            let ratingData: PlayerRating | undefined;

            if (statEntries.length > 0) {
              ratingData = calculatePlayerRating(statEntries, primaryPosition);
              rating = ratingData.overall;
            }

            const membership = playersData.find((p) => p.id === player.id);

            return {
              ...player,
              rating,
              ratingData,
              jerseyNumber: membership?.team_memberships?.[0]?.jersey_number,
            } as PlayerWithRating;
          })
        );

        if (cancelled) return;
        setPlayers(playersWithRatings);
        setIsLoadingPlayers(false);
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading team data:', error);
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: t('common.messages.error'),
          duration: 5000,
        });
        setIsLoadingPlayers(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id, addNotification, t, reloadKey]);

  if (!team && !isLoadingPlayers) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">{t('common.messages.noData')}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/teams')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.buttons.back')}
      </Button>

      {/* Team Header */}
      {team && (
        <div className="mb-6">
          <TeamHeader
            teamName={team.name}
            seasonName={team.season.name}
            inviteCode={team.invite_code}
            teamRating={teamRating}
            formStreak={formStreak}
            isLoading={isLoadingTeamStats}
          />
        </div>
      )}

      {/* Pending Players (coaches only) */}
      {isCoach && pendingPlayers.length > 0 && (
        <div className="mb-6">
          <PendingPlayers
            pendingPlayers={pendingPlayers}
            onUpdate={() => setReloadKey((k) => k + 1)}
            addNotification={addNotification}
          />
        </div>
      )}

      {/* Tabbed Dashboard */}
      {isPlayer ? (
        /* Limited view for players: roster + latest results only, no stats/scores/ratings */
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">{t('team.dashboard.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="squad">{t('team.dashboard.tabs.squad')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab - latest results only */}
          <TabsContent value="overview" className="space-y-6">
            <TeamGameLog gameStats={gameStats.slice(0, 3)} isLoading={isLoadingTeamStats} />
          </TabsContent>

          {/* Squad Tab - names and positions only, no ratings */}
          <TabsContent value="squad" className="space-y-6">
            <SquadRoster players={players} isLoading={isLoadingPlayers} hideRatings />
          </TabsContent>
        </Tabs>
      ) : (
        /* Full view for coaches */
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('team.dashboard.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="squad">{t('team.dashboard.tabs.squad')}</TabsTrigger>
            <TabsTrigger value="stats">{t('team.dashboard.tabs.stats')}</TabsTrigger>
            <TabsTrigger value="compare">{t('team.dashboard.tabs.compare')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TeamRatingRadar teamRating={teamRating} isLoading={isLoadingTeamStats} />
              <BestXIFormation bestXI={bestXI} isLoading={isLoadingTeamStats} />
            </div>
            <AttendanceLeaderboard
              attendanceRates={attendanceRates}
              limit={10}
              isLoading={isLoadingPlayers}
            />
          </TabsContent>

          {/* Squad Tab */}
          <TabsContent value="squad" className="space-y-6">
            <SquadRoster players={players} isLoading={isLoadingPlayers} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <TeamPerformanceTrends gameStats={gameStats} isLoading={isLoadingTeamStats} />
            <TeamGameLog gameStats={gameStats} isLoading={isLoadingTeamStats} />
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-6">
            <PlayerComparison
              players={players.map((p) => ({
                ...p,
                rating: p.ratingData,
              }))}
              isLoading={isLoadingPlayers}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
