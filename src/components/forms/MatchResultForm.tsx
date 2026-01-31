import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

export interface MatchResultData {
  setsWon: number;
  setsLost: number;
  setScores: number[][]; // [[our_score, opponent_score], ...]
}

interface MatchResultFormProps {
  initialData?: MatchResultData;
  onSubmit: (data: MatchResultData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * MatchResultForm component
 * Form for entering match results (sets won/lost and set scores)
 */
export function MatchResultForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MatchResultFormProps) {
  const { t } = useTranslation();

  const [setScores, setSetScores] = useState<number[][]>(
    initialData?.setScores || [[0, 0]]
  );

  const handleAddSet = () => {
    setSetScores([...setScores, [0, 0]]);
  };

  const handleRemoveSet = (index: number) => {
    if (setScores.length > 1) {
      setSetScores(setScores.filter((_, i) => i !== index));
    }
  };

  const handleSetScoreChange = (setIndex: number, teamIndex: 0 | 1, value: string) => {
    const numValue = parseInt(value) || 0;
    const newSetScores = [...setScores];
    newSetScores[setIndex][teamIndex] = numValue;
    setSetScores(newSetScores);
  };

  const calculateWinsLosses = (scores: number[][]): { won: number; lost: number } => {
    let won = 0;
    let lost = 0;

    scores.forEach(([ourScore, opponentScore]) => {
      if (ourScore > opponentScore) won++;
      else if (opponentScore > ourScore) lost++;
    });

    return { won, lost };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { won, lost } = calculateWinsLosses(setScores);

    const data: MatchResultData = {
      setsWon: won,
      setsLost: lost,
      setScores,
    };

    onSubmit(data);
  };

  const { won, lost } = calculateWinsLosses(setScores);

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.matchResult.title')}</CardTitle>
          <CardDescription>{t('team.dashboard.matchResult.enterScore')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Set Scores */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('team.dashboard.matchResult.setScores')}
            </label>

            {setScores.map((scores, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[60px]">
                  {t('team.dashboard.matchResult.setNumber', { number: index + 1 })}
                </span>

                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={scores[0]}
                    onChange={(e) => handleSetScoreChange(index, 0, e.target.value)}
                    className="w-20 text-center"
                    placeholder="0"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={scores[1]}
                    onChange={(e) => handleSetScoreChange(index, 1, e.target.value)}
                    className="w-20 text-center"
                    placeholder="0"
                  />
                </div>

                {setScores.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSet(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSet}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('team.dashboard.matchResult.addSet')}
            </Button>
          </div>

          {/* Match Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('team.dashboard.matchResult.setsWon')}:
              </span>
              <span className="font-semibold">{won}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                {t('team.dashboard.matchResult.setsLost')}:
              </span>
              <span className="font-semibold">{lost}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                {t('common.buttons.cancel')}
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? t('common.messages.saving')
                : t('team.dashboard.matchResult.saveResult')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
