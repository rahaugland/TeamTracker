import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createSkillRating } from '@/services/player-feedback.service';
import type { CreateSkillRatingInput } from '@/services/player-feedback.service';
import type { SkillRatingType } from '@/types/database.types';

interface SkillRatingWidgetProps {
  playerId: string;
  teamId: string;
  authorId: string;
  onSaved: () => void;
}

const SKILL_TYPES: SkillRatingType[] = ['serve', 'pass', 'attack', 'block', 'set', 'defense'];

/**
 * SkillRatingWidget component
 * Interactive widget for coaches to rate player skills on a 1-10 scale
 */
export function SkillRatingWidget({
  playerId,
  teamId,
  authorId,
  onSaved,
}: SkillRatingWidgetProps) {
  const { t } = useTranslation();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleRatingChange = (skillType: SkillRatingType, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [skillType]: rating,
    }));
  };

  const handleSave = async () => {
    const changedSkills = Object.entries(ratings);
    if (changedSkills.length === 0) {
      return;
    }

    setIsSaving(true);

    try {
      for (const [skillType, rating] of changedSkills) {
        const input: CreateSkillRatingInput = {
          player_id: playerId,
          team_id: teamId,
          author_id: authorId,
          skill_type: skillType as SkillRatingType,
          rating,
        };

        await createSkillRating(input);
      }

      setRatings({});
      onSaved();
    } catch (error) {
      console.error('Failed to save skill ratings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playerExperience.skills.rateSkills')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {SKILL_TYPES.map((skillType) => (
          <div key={skillType} className="space-y-2">
            <Label>{t(`playerExperience.skills.${skillType}`)}</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange(skillType, rating)}
                    disabled={isSaving}
                    className={`
                      h-10 w-10 rounded-md border-2 text-sm font-semibold transition-all
                      ${
                        ratings[skillType] === rating
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-input hover:bg-accent hover:border-primary'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              {ratings[skillType] && (
                <span className="text-sm text-muted-foreground ml-2">
                  {t('playerExperience.skills.selected')}: {ratings[skillType]}
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || Object.keys(ratings).length === 0}
        >
          {isSaving
            ? t('common.messages.saving')
            : t('playerExperience.skills.saveRatings')}
        </Button>
      </CardFooter>
    </Card>
  );
}
