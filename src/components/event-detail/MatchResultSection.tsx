import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchResultForm, type MatchResultData } from '@/components/forms/MatchResultForm';

interface MatchResultSectionProps {
  setsWon?: number | null;
  setsLost?: number | null;
  setScores?: number[][] | null;
  isFinalized: boolean;
  isCoach: boolean;
  isSubmitting: boolean;
  showForm: boolean;
  onToggleForm: () => void;
  onSave: (data: MatchResultData) => void;
}

export function MatchResultSection({
  setsWon,
  setsLost,
  setScores,
  isFinalized,
  isCoach,
  isSubmitting,
  showForm,
  onToggleForm,
  onSave,
}: MatchResultSectionProps) {
  const { t } = useTranslation();

  // Read-only view when finalized
  if (isFinalized && setsWon !== undefined && setsLost !== undefined) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('team.dashboard.matchResult.title')}</CardTitle>
          <CardDescription>{setsWon}-{setsLost}</CardDescription>
        </CardHeader>
        {setScores && setScores.length > 0 && (
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {setScores.map((scores, i) => (
                <span key={i} className="px-3 py-1 text-sm rounded bg-muted border">
                  {t('team.dashboard.matchResult.setNumber', { number: i + 1 })}: {scores[0]}-{scores[1]}
                </span>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Editable view for coaches when not finalized
  if (isCoach && !isFinalized) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('team.dashboard.matchResult.title')}</CardTitle>
              <CardDescription>
                {setsWon !== undefined && setsLost !== undefined
                  ? `${setsWon}-${setsLost}`
                  : t('team.dashboard.matchResult.enterScore')}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={onToggleForm}
            >
              {setsWon !== undefined
                ? t('team.dashboard.matchResult.editResult')
                : t('team.dashboard.matchResult.enterScore')}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <MatchResultForm
              initialData={
                setsWon !== undefined && setsWon !== null && setsLost !== undefined && setsLost !== null
                  ? {
                      setsWon: setsWon,
                      setsLost: setsLost,
                      setScores: setScores || [],
                    }
                  : undefined
              }
              onSubmit={onSave}
              onCancel={onToggleForm}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        )}
      </Card>
    );
  }

  return null;
}
