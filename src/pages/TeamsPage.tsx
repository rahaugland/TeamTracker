import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSeasons, useTeams } from '@/store';
import { getSeasons, getActiveSeason } from '@/services/seasons.service';
import { getTeams, createTeam, deleteTeam, assignCoach } from '@/services/teams.service';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TeamForm } from '@/components/forms/TeamForm';
import type { TeamFormData } from '@/lib/validations/team';

/**
 * TeamsPage component
 * Lists all teams and allows creating/editing teams
 */
export function TeamsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { seasons, activeSeason, setSeasons, setActiveSeason } = useSeasons();
  const { teams, setTeams, setActiveTeam } = useTeams();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; teamId: string | null }>({
    open: false,
    teamId: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [seasonsData, activeSeasonData] = await Promise.all([
        getSeasons(),
        getActiveSeason(),
      ]);

      setSeasons(seasonsData);
      setActiveSeason(activeSeasonData);

      if (activeSeasonData) {
        const teamsData = await getTeams(activeSeasonData.id);
        setTeams(teamsData as any);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (data: TeamFormData) => {
    setIsSaving(true);
    try {
      const newTeam = await createTeam({
        name: data.name,
        season_id: data.seasonId,
      });

      // Auto-assign creating coach to the new team
      if (user?.id && (user.role === 'head_coach' || user.role === 'assistant_coach')) {
        try {
          await assignCoach(newTeam.id, user.id, user.role);
        } catch (e) {
          console.error('Error auto-assigning coach:', e);
        }
      }

      setTeams([...teams, newTeam as any]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteConfirm.teamId) return;

    try {
      await deleteTeam(deleteConfirm.teamId);
      setTeams(teams.filter((t) => t.id !== deleteConfirm.teamId));
      setDeleteConfirm({ open: false, teamId: null });
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!activeSeason) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <EmptyState
          title={t('season.noSeasons')}
          description={t('season.noSeasonsDescription')}
          action={{
            label: t('season.addSeason'),
            onClick: () => navigate('/seasons'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="gradient-secondary px-4 py-12 mb-8 shadow-lg">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{t('navigation.teams')}</h1>
            <p className="text-white/90 text-lg">
              {activeSeason.name}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg" className="shadow-xl">
            {t('team.addTeam')}
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-8">

      {teams.length === 0 ? (
        <EmptyState
          title={t('team.noTeams')}
          description={t('team.noTeamsDescription')}
          action={{
            label: t('team.addTeam'),
            onClick: () => setShowCreateDialog(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <Card
              key={team.id}
              className={`hover-glow border-l-4 ${
                index % 3 === 0
                  ? 'border-l-primary card-gradient-orange'
                  : index % 3 === 1
                  ? 'border-l-secondary card-gradient-blue'
                  : 'border-l-accent card-gradient-teal'
              }`}
            >
              <CardHeader>
                <CardTitle className={
                  index % 3 === 0
                    ? 'text-primary'
                    : index % 3 === 1
                    ? 'text-secondary'
                    : 'text-accent'
                }>{team.name}</CardTitle>
                <CardDescription className="font-medium">{activeSeason.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setActiveTeam(team.id);
                      navigate(`/teams/${team.id}`);
                    }}
                  >
                    {t('team.viewRoster')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, teamId: team.id })}
                  >
                    {t('common.buttons.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('team.addTeam')}</DialogTitle>
          </DialogHeader>
          <TeamForm
            seasons={seasons}
            onSubmit={handleCreateTeam}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, teamId: null })}
        title={t('team.deleteTeam')}
        description={t('team.deleteConfirm')}
        onConfirm={handleDeleteTeam}
        variant="destructive"
      />
    </div>
  );
}
