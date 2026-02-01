import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createReview } from '@/services/player-feedback.service';
import type { CreateReviewInput } from '@/services/player-feedback.service';

interface WriteReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  teamId: string;
  seasonId?: string;
  authorId: string;
  onSaved: () => void;
}

/**
 * WriteReviewModal component
 * Dialog for coaches to write comprehensive player reviews
 */
export function WriteReviewModal({
  open,
  onOpenChange,
  playerId,
  playerName,
  teamId,
  seasonId,
  authorId,
  onSaved,
}: WriteReviewModalProps) {
  const { t } = useTranslation();
  const [strengths, setStrengths] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [goals, setGoals] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!strengths.trim() && !areasToImprove.trim() && !goals.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const input: CreateReviewInput = {
        player_id: playerId,
        team_id: teamId,
        season_id: seasonId,
        author_id: authorId,
        strengths: strengths.trim(),
        areas_to_improve: areasToImprove.trim(),
        goals_text: goals.trim(),
      };

      await createReview(input);
      setStrengths('');
      setAreasToImprove('');
      setGoals('');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create review:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setStrengths('');
    setAreasToImprove('');
    setGoals('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t('playerExperience.reviews.writeReview', { playerName })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="review-strengths">
              {t('playerExperience.reviews.strengths')}
            </Label>
            <Textarea
              id="review-strengths"
              placeholder={t('playerExperience.reviews.strengthsPlaceholder')}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-areas">
              {t('playerExperience.reviews.areasToImprove')}
            </Label>
            <Textarea
              id="review-areas"
              placeholder={t('playerExperience.reviews.areasPlaceholder')}
              value={areasToImprove}
              onChange={(e) => setAreasToImprove(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-goals">
              {t('playerExperience.reviews.goals')}
            </Label>
            <Textarea
              id="review-goals"
              placeholder={t('playerExperience.reviews.goalsPlaceholder')}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            {t('common.buttons.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              (!strengths.trim() && !areasToImprove.trim() && !goals.trim())
            }
          >
            {isSaving ? t('common.messages.saving') : t('common.buttons.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
