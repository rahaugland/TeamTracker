import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getDrillWithProgression, deleteDrill } from '@/services/drills.service';
import { getExecutionsByDrill } from '@/services/drill-executions.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { DrillWithProgression } from '@/services/drills.service';
import type { DrillExecutionWithDetails } from '@/services/drill-executions.service';

/**
 * DrillDetailPage component
 * Shows drill details, progression chain, and execution history
 */
export function DrillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [drill, setDrill] = useState<DrillWithProgression | null>(null);
  const [executions, setExecutions] = useState<DrillExecutionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  useEffect(() => {
    if (id) {
      loadDrillData(id);
    }
  }, [id]);

  const loadDrillData = async (drillId: string) => {
    setIsLoading(true);
    try {
      const [drillData, executionData] = await Promise.all([
        getDrillWithProgression(drillId),
        getExecutionsByDrill(drillId),
      ]);

      setDrill(drillData);
      setExecutions(executionData);
    } catch (error) {
      console.error('Error loading drill data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/drills/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteDrill(id);
      navigate('/drills');
    } catch (error) {
      console.error('Error deleting drill:', error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const calculateAverageRating = () => {
    const ratedExecutions = executions.filter((e) => e.coach_rating);
    if (ratedExecutions.length === 0) return null;

    const sum = ratedExecutions.reduce((acc, e) => acc + (e.coach_rating || 0), 0);
    return (sum / ratedExecutions.length).toFixed(1);
  };

  const getSuccessfulExecutions = () => {
    return executions.filter((e) => e.coach_rating && e.coach_rating >= 3).length;
  };

  const isReadyToAdvance = () => {
    return getSuccessfulExecutions() >= 3;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Drill not found</p>
      </div>
    );
  }

  const avgRating = calculateAverageRating();
  const readyToAdvance = isReadyToAdvance();

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate('/drills')} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{drill.name}</h1>
              <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                Level {drill.progression_level}
              </span>
              {readyToAdvance && (
                <span className="px-3 py-1 text-sm font-medium bg-emerald-500/15 text-emerald-400 rounded-full">
                  {t('drill.advanceBadge')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {drill.skill_tags.map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded">
                  {t(`drill.skills.${tag.replace('-', '')}` as any)}
                </span>
              ))}
            </div>
          </div>
          {isCoach && !drill.is_system_drill && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                {t('common.buttons.edit')}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
                {t('common.buttons.delete')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="progression">{t('drill.progressionChain')}</TabsTrigger>
          <TabsTrigger value="history">{t('drill.executionHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('common.labels.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{drill.description}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drill.min_players && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {drill.min_players}-{drill.max_players || '∞'}
                  </p>
                </CardContent>
              </Card>
            )}

            {drill.duration_minutes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('practice.duration')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{drill.duration_minutes} min</p>
                </CardContent>
              </Card>
            )}
          </div>

          {drill.equipment_needed && drill.equipment_needed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('drill.equipment')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {drill.equipment_needed.map((item, index) => (
                    <li key={index} className="text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {drill.video_url && (
            <Card>
              <CardHeader>
                <CardTitle>Video Demonstration</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={drill.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {drill.video_url}
                </a>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progression" className="space-y-6">
          {drill.parent_drill && (
            <Card>
              <CardHeader>
                <CardTitle>{t('drill.parentDrill')}</CardTitle>
                <CardDescription>Previous level in progression</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/drills/${drill.parent_drill?.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{drill.parent_drill.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Level {drill.parent_drill.progression_level}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {drill.child_drills && drill.child_drills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('drill.childDrills')}</CardTitle>
                <CardDescription>Next level progressions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {drill.child_drills.map((child) => (
                    <div
                      key={child.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/drills/${child.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {child.progression_level}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!drill.parent_drill && (!drill.child_drills || drill.child_drills.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  This drill is not part of a progression chain
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {executions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Executions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{executions.length}</p>
                </CardContent>
              </Card>

              {avgRating && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('drill.averageRating')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{avgRating} / 5</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {executions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{t('drill.noExecutions')}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <div key={execution.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{execution.event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.executed_at).toLocaleDateString()}
                          </p>
                        </div>
                        {execution.coach_rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < execution.coach_rating!
                                    ? 'text-club-secondary'
                                    : 'text-muted-foreground/30'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {execution.notes && (
                        <p className="text-sm text-muted-foreground">{execution.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {execution.duration_minutes} minutes
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        onConfirm={handleDelete}
        title={t('drill.deleteDrill')}
        description={t('drill.deleteConfirm')}
        loading={isDeleting}
      />
    </div>
  );
}
