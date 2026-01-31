import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSeasons, useTeams, usePlayers } from '@/store';
import { getActiveSeason } from '@/services/seasons.service';
import { getTeams } from '@/services/teams.service';
import { getPlayers } from '@/services/players.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_NAMES } from '@/types/database.types';
import {
  AttendanceOverviewWidget,
  UpcomingEventsWidget,
  TopDrillsWidget,
  PlayerAttendanceWidget,
  RecentActivityWidget,
} from '@/components/dashboard';
import { getDateRangePreset, type DateRange } from '@/services/analytics.service';

/**
 * Dashboard page
 * Main landing page showing analytics and quick access widgets
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeSeason, setActiveSeason } = useSeasons();
  const { teams, setTeams, activeTeamId, setActiveTeam } = useTeams();
  const { players, setPlayers } = usePlayers();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(activeTeamId);
  const [dateRangePreset, setDateRangePreset] = useState<'week' | 'month' | 'season'>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getDateRangePreset('month')
  );

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeSeasonData, playersData] = await Promise.all([
        getActiveSeason(),
        getPlayers(),
      ]);

      setActiveSeason(activeSeasonData);
      setPlayers(playersData);

      if (activeSeasonData) {
        const teamsData = await getTeams(activeSeasonData.id);
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setActiveSeason, setPlayers, setTeams]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Sync with global activeTeamId
    if (activeTeamId && activeTeamId !== selectedTeamId) {
      setSelectedTeamId(activeTeamId);
    }
  }, [activeTeamId, selectedTeamId]);

  useEffect(() => {
    // Auto-select first team if available
    if (teams.length > 0 && !selectedTeamId) {
      const firstTeamId = teams[0].id;
      setSelectedTeamId(firstTeamId);
      setActiveTeam(firstTeamId);
    }
  }, [teams, selectedTeamId, setActiveTeam]);

  useEffect(() => {
    // Update date range when preset changes
    setDateRange(getDateRangePreset(dateRangePreset));
  }, [dateRangePreset]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-hero px-4 py-12 mb-8 shadow-lg">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('auth.profile.welcome', { name: user?.name || 'Coach' })}
          </h1>
          {user?.role && (
            <p className="text-white/90 text-lg">
              {t('auth.profile.role', { role: ROLE_NAMES[user.role] })}
            </p>
          )}
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 pb-8">

      {activeSeason ? (
        <Card className="mb-8 card-gradient-orange border-l-4 border-l-primary shadow-lg hover-glow">
          <CardHeader>
            <CardTitle className="text-primary text-xl">{t('season.activeSeason')}</CardTitle>
            <CardDescription className="text-base font-medium">{activeSeason.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">
                  {new Date(activeSeason.start_date).toLocaleDateString()} -{' '}
                  {new Date(activeSeason.end_date).toLocaleDateString()}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  {teams.length} {teams.length === 1 ? t('team.singular') : t('team.plural')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-2 border-dashed border-primary/30 bg-primary/5 hover-glow">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">{t('player.noActiveSeason')}</p>
            <Button onClick={() => navigate('/seasons')} className="shadow-lg">{t('season.addSeason')}</Button>
          </CardContent>
        </Card>
      )}

      {teams.length > 0 && selectedTeamId ? (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                {t('dashboard.filters.selectTeam')}
              </label>
              <Select
                value={selectedTeamId || ''}
                onValueChange={(teamId) => {
                  setSelectedTeamId(teamId);
                  setActiveTeam(teamId);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('team.selectTeam')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                {t('dashboard.filters.dateRange')}
              </label>
              <Select
                value={dateRangePreset}
                onValueChange={(value: any) => setDateRangePreset(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('dashboard.filters.last7Days')}</SelectItem>
                  <SelectItem value="month">{t('dashboard.filters.last30Days')}</SelectItem>
                  <SelectItem value="season">{t('dashboard.filters.thisSeason')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Analytics Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <AttendanceOverviewWidget teamId={selectedTeamId} dateRange={dateRange} />
            <div className="lg:col-span-2">
              <UpcomingEventsWidget teamId={selectedTeamId} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TopDrillsWidget teamId={selectedTeamId} dateRange={dateRange} />
            <RecentActivityWidget teamId={selectedTeamId} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <PlayerAttendanceWidget teamId={selectedTeamId} dateRange={dateRange} />
          </div>
        </>
      ) : (
        <Card className="border-2 border-dashed border-secondary/30 bg-secondary/5 hover-glow">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t('team.noTeams')}</p>
            <Button onClick={() => navigate('/teams')} className="shadow-lg">{t('team.addTeam')}</Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
