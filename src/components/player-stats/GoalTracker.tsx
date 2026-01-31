import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { PlayerGoal, GoalMetricType } from '@/types/database.types';
import { PlayerGoalForm } from '@/components/forms/PlayerGoalForm';
import type { PlayerGoalFormData } from '@/lib/validations/playerGoal';
import { useTranslation } from 'react-i18next';

interface GoalTrackerProps {
  goals: PlayerGoal[];
  isCoach: boolean;
  onCreateGoal: (data: PlayerGoalFormData) => Promise<void>;
  onToggleComplete: (goalId: string, isCompleted: boolean) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

const METRIC_COLORS: Record<GoalMetricType, string> = {
  kill_pct: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pass_rating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  serve_pct: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  attendance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function GoalTracker({ goals, isCoach, onCreateGoal, onToggleComplete, onDeleteGoal }: GoalTrackerProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  const handleCreate = async (data: PlayerGoalFormData) => {
    setIsSubmitting(true);
    try {
      await onCreateGoal(data);
      setDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = (goal: PlayerGoal) => {
    if (goal.target_value === 0) return 0;
    return Math.min(100, (goal.current_value / goal.target_value) * 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('goals.title')}</CardTitle>
        {isCoach && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                {t('goals.addGoal')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('goals.addGoal')}</DialogTitle>
              </DialogHeader>
              <PlayerGoalForm
                onSubmit={handleCreate}
                onCancel={() => setDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length === 0 && completedGoals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('goals.noGoals')}
          </p>
        )}

        {activeGoals.map((goal) => (
          <div key={goal.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{goal.title}</span>
                  <Badge variant="secondary" className={METRIC_COLORS[goal.metric_type]}>
                    {t(`goals.metricTypes.${goal.metric_type}`)}
                  </Badge>
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
              </div>
              {isCoach && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onToggleComplete(goal.id, true)}
                    title={t('goals.markComplete')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDeleteGoal(goal.id)}
                    title={t('common.buttons.delete')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{goal.current_value.toFixed(1)}</span>
                <span className="text-muted-foreground">{goal.target_value.toFixed(1)}</span>
              </div>
              <Progress value={progressPercent(goal)} />
            </div>
            {goal.deadline && (
              <p className="text-xs text-muted-foreground">
                {t('goals.deadline')}: {format(new Date(goal.deadline), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        ))}

        {completedGoals.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-full py-2"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {t('goals.completedGoals', { count: completedGoals.length })}
            </button>
            {showCompleted && (
              <div className="space-y-2 mt-2">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="rounded-lg border p-3 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-medium line-through">{goal.title}</span>
                        <Badge variant="secondary" className={METRIC_COLORS[goal.metric_type]}>
                          {t(`goals.metricTypes.${goal.metric_type}`)}
                        </Badge>
                      </div>
                      {isCoach && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onToggleComplete(goal.id, false)}
                          title={t('goals.markIncomplete')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {goal.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('goals.completedAt', { date: format(new Date(goal.completed_at), 'MMM d, yyyy') })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
