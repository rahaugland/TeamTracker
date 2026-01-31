import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DrillExecutionsCard } from './DrillExecutionsCard';
import type { PracticePlanWithBlocks } from '@/services/practice-plans.service';
import type { DrillExecution } from '@/types/database.types';

interface EventPracticePlanCardProps {
  practicePlan: PracticePlanWithBlocks;
  drillExecutions: Record<string, DrillExecution>;
  executionNotes: Record<string, string>;
  isCoach: boolean;
  onMarkExecuted: (drillId: string, rating: number) => void;
  onNotesChange: (drillId: string, notes: string) => void;
}

export function EventPracticePlanCard({
  practicePlan,
  drillExecutions,
  executionNotes,
  isCoach,
  onMarkExecuted,
  onNotesChange,
}: EventPracticePlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('practice.plan')}</CardTitle>
            <CardDescription>{practicePlan.name}</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/practice-plans/${practicePlan.id}`)}
          >
            View Plan
          </Button>
        </div>
      </CardHeader>
      <DrillExecutionsCard
        practicePlan={practicePlan}
        drillExecutions={drillExecutions}
        executionNotes={executionNotes}
        isCoach={isCoach}
        onMarkExecuted={onMarkExecuted}
        onNotesChange={onNotesChange}
      />
    </Card>
  );
}
