import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import {
  getTeamSeasons,
  createTeamSeason,
  deleteTeamSeason,
  finalizeTeamSeason,
  getSeasonAwards,
} from '@/services/team-seasons.service';
import { getPlayersByTeam } from '@/services/players.service';
import type { TeamSeason, SeasonAward } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SeasonManager } from '@/components/seasons/SeasonManager';
import { SeasonAwardsDisplay } from '@/components/seasons/SeasonAwards';
import { SeasonSummary } from '@/components/seasons/SeasonSummary';
import { SeasonComparison } from '@/components/seasons/SeasonComparison';
import { cn } from '@/lib/utils';

export function TeamSeasonsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [seasons, setSeasons] = useState<TeamSeason[]>([]);
  const [players, setPlayers] = useState<PlayerWithMemberships[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [seasonAwards, setSeasonAwards] = useState<Record<string, SeasonAward[]>>({});
  const [finalizeConfirm, setFinalizeConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  const playerNames: Record<string, string> = {};
  for (const p of players) {
    playerNames[p.id] = p.name;
  }

  useEffect(() => {
    if (teamId) loadData();
  }, [teamId]);

  const loadData = async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const [seasonsData, playersData] = await Promise.all([
        getTeamSeasons(teamId),
        getPlayersByTeam(teamId),
      ]);
      setSeasons(seasonsData);
      setPlayers(playersData);

      // Auto-expand active (non-finalized) season
      const active = seasonsData.find((s) => !s.is_finalized);
      if (active) setExpandedSeason(active.id);

      // Load awards for finalized seasons
      const awardsMap: Record<string, SeasonAward[]> = {};
      for (const s of seasonsData) {
        if (s.is_finalized) {
          awardsMap[s.id] = await getSeasonAwards(s.id);
        }
      }
      setSeasonAwards(awardsMap);
    } catch (err) {
      console.error('Error loading team seasons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: { name: string; start_date: string; end_date: string }) => {
    if (!teamId || !user?.id) return;
    setIsSubmitting(true);
    try {
      await createTeamSeason({ ...data, team_id: teamId, created_by: user.id });
      setShowCreate(false);
      await loadData();
    } catch (err) {
      console.error('Error creating team season:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!finalizeConfirm) return;
    setIsSubmitting(true);
    try {
      const awards = await finalizeTeamSeason(finalizeConfirm);
      setSeasonAwards((prev) => ({ ...prev, [finalizeConfirm]: awards }));
      setFinalizeConfirm(null);
      await loadData();
    } catch (err) {
      console.error('Error finalizing season:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTeamSeason(deleteConfirm);
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting team season:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('awards.teamSeasons')}</h1>
        {isCoach && (
          <Button onClick={() => setShowCreate(true)}>
            {t('awards.createSeason')}
          </Button>
        )}
      </div>

      {seasons.length >= 2 && (
        <div className="mb-6">
          <SeasonComparison teamId={teamId!} seasons={seasons} />
        </div>
      )}

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('awards.noTeamSeasons')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => (
            <Card
              key={season.id}
              className={cn(
                'border-l-4',
                season.is_finalized ? 'border-l-green-500' : 'border-l-primary'
              )}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {season.name}
                      {season.is_finalized && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {t('awards.finalized')}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {isCoach && !season.is_finalized && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setFinalizeConfirm(season.id); }}
                      >
                        {t('awards.endSeason')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(season.id); }}
                      >
                        {t('common.buttons.delete')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              {expandedSeason === season.id && (
                <CardContent className="space-y-6">
                  <SeasonSummary teamId={teamId!} startDate={season.start_date} endDate={season.end_date} />
                  {season.is_finalized && seasonAwards[season.id] && (
                    <SeasonAwardsDisplay awards={seasonAwards[season.id]} playerNames={playerNames} />
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <SeasonManager
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        open={finalizeConfirm !== null}
        onOpenChange={(open) => !open && setFinalizeConfirm(null)}
        title={t('awards.endSeasonTitle')}
        description={t('awards.endSeasonConfirm')}
        onConfirm={handleFinalize}
        loading={isSubmitting}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={t('common.messages.confirmDelete')}
        description={t('awards.deleteSeasonConfirm')}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
