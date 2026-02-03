import { useTranslation } from 'react-i18next';
import { CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { PracticePlanWithBlocks } from '@/services/practice-plans.service';
import type { DrillExecution } from '@/types/database.types';

interface DrillExecutionsCardProps {
  practicePlan: PracticePlanWithBlocks;
  drillExecutions: Record<string, DrillExecution>;
  executionNotes: Record<string, string>;
  isCoach: boolean;
  onMarkExecuted: (drillId: string, rating: number) => void;
  onNotesChange: (drillId: string, notes: string) => void;
}

export function DrillExecutionsCard({
  practicePlan,
  drillExecutions,
  executionNotes,
  isCoach,
  onMarkExecuted,
  onNotesChange,
}: DrillExecutionsCardProps) {
  const { t } = useTranslation();

  return (
    <CardContent>
      <div className="space-y-4">
        {practicePlan.practice_blocks
          .filter((block) => block.drill_id)
          .map((block) => {
            if (!block.drill_id || !block.drill) return null;

            const execution = drillExecutions[block.drill_id];
            const currentRating = execution?.coach_rating;

            return (
              <div key={block.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{block.drill.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {block.duration_minutes} min • Level {block.drill.progression_level}
                    </p>
                    {block.drill.skill_tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {block.drill.skill_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                          >
                            {t(`drill.skills.${tag.replace('-', '')}` as any)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {execution && (
                    <span className="px-3 py-1 text-sm font-medium bg-emerald-500/15 text-emerald-400 rounded-full">
                      Executed
                    </span>
                  )}
                </div>

                {isCoach && (
                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('drill.rateExecution')}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => onMarkExecuted(block.drill_id!, rating)}
                            className={`w-10 h-10 rounded-md border transition-colors ${
                              currentRating === rating
                                ? 'bg-club-secondary text-white border-club-secondary'
                                : 'hover:bg-accent'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('common.labels.notes')}
                      </label>
                      <Textarea
                        placeholder="Notes about this drill execution..."
                        rows={2}
                        value={executionNotes[block.drill_id!] || execution?.notes || ''}
                        onChange={(e) => onNotesChange(block.drill_id!, e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </CardContent>
  );
}
