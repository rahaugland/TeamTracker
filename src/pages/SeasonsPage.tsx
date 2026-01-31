import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSeasons } from '@/store';
import {
  getSeasons,
  createSeason,
  deleteSeason,
  setActiveSeason as setActiveSeasonService,
} from '@/services/seasons.service';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SeasonForm } from '@/components/forms/SeasonForm';
import type { SeasonFormData } from '@/lib/validations/team';
import { cn } from '@/lib/utils';

/**
 * SeasonsPage component
 * Manages seasons - create, activate, archive, delete
 */
export function SeasonsPage() {
  const { t } = useTranslation();
  const { seasons, activeSeason, setSeasons, setActiveSeason } = useSeasons();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; seasonId: string | null }>({
    open: false,
    seasonId: null,
  });

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    setIsLoading(true);
    try {
      const data = await getSeasons();
      setSeasons(data);

      const active = data.find((s) => s.is_active);
      setActiveSeason(active || null);
    } catch (error) {
      console.error('Error loading seasons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSeason = async (data: SeasonFormData) => {
    setIsSaving(true);
    try {
      const newSeason = await createSeason({
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        is_active: false,
      });

      setSeasons([...seasons, newSeason]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating season:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetActive = async (seasonId: string) => {
    try {
      const updated = await setActiveSeasonService(seasonId);

      setSeasons(
        seasons.map((s) =>
          s.id === seasonId ? { ...s, is_active: true } : { ...s, is_active: false }
        )
      );
      setActiveSeason(updated);
    } catch (error) {
      console.error('Error setting active season:', error);
    }
  };

  const handleDeleteSeason = async () => {
    if (!deleteConfirm.seasonId) return;

    try {
      await deleteSeason(deleteConfirm.seasonId);
      setSeasons(seasons.filter((s) => s.id !== deleteConfirm.seasonId));

      if (activeSeason?.id === deleteConfirm.seasonId) {
        setActiveSeason(null);
      }

      setDeleteConfirm({ open: false, seasonId: null });
    } catch (error) {
      console.error('Error deleting season:', error);
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
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="gradient-hero px-4 py-12 mb-8 shadow-lg">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">{t('season.plural')}</h1>
          <Button onClick={() => setShowCreateDialog(true)} size="lg" className="shadow-xl">
            {t('season.addSeason')}
          </Button>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 pb-8">

      {seasons.length === 0 ? (
        <EmptyState
          title={t('season.noSeasons')}
          description={t('season.noSeasonsDescription')}
          action={{
            label: t('season.addSeason'),
            onClick: () => setShowCreateDialog(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => (
            <Card
              key={season.id}
              className={cn(
                'hover-glow border-l-4',
                season.is_active
                  ? 'border-l-primary card-gradient-orange shadow-lg shadow-primary/20'
                  : 'border-l-secondary/30'
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      {season.name}
                      {season.is_active && (
                        <span className="status-success text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          {t('season.isActive')}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {new Date(season.start_date).toLocaleDateString()} -{' '}
                      {new Date(season.end_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!season.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(season.id)}
                      >
                        {t('season.setActive')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm({ open: true, seasonId: season.id })}
                    >
                      {t('common.buttons.delete')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('season.addSeason')}</DialogTitle>
          </DialogHeader>
          <SeasonForm
            onSubmit={handleCreateSeason}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, seasonId: null })}
        title={t('season.deleteSeason')}
        description={t('season.deleteConfirm')}
        onConfirm={handleDeleteSeason}
        variant="destructive"
      />
    </div>
  );
}
