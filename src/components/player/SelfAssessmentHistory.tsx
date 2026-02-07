import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle } from 'lucide-react';
import type { SelfAssessmentWithEvent } from '@/services/self-assessment.service';

interface SelfAssessmentHistoryProps {
  assessments: SelfAssessmentWithEvent[];
}

export function SelfAssessmentHistory({ assessments }: SelfAssessmentHistoryProps) {
  const { t } = useTranslation();

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.selfAssessment.noHistory')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedAssessments = assessments.toSorted(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playerExperience.selfAssessment.history')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{assessment.event.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(assessment.event.start_time), 'MMM d, yyyy')}
                  </p>
                  {assessment.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {assessment.notes}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Circle
                        key={value}
                        className={`w-4 h-4 ${
                          value <= assessment.rating
                            ? 'fill-club-secondary text-club-secondary'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    {assessment.rating}/5
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
