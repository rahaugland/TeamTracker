import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createFeedback } from '@/services/player-feedback.service';
import type { CreateFeedbackInput } from '@/services/player-feedback.service';

interface PlayerFeedbackInputProps {
  eventId: string;
  playerId: string;
  playerName: string;
  authorId: string;
  existingFeedback?: string;
  onSaved: () => void;
}

/**
 * PlayerFeedbackInput component
 * Inline form for writing feedback for a specific player after an event
 */
export function PlayerFeedbackInput({
  eventId,
  playerId,
  playerName,
  authorId,
  existingFeedback,
  onSaved,
}: PlayerFeedbackInputProps) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState(existingFeedback || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!feedback.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const input: CreateFeedbackInput = {
        player_id: playerId,
        event_id: eventId,
        author_id: authorId,
        content: feedback.trim(),
      };

      await createFeedback(input);
      setFeedback('');
      onSaved();
    } catch (error) {
      console.error('Failed to create feedback:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('playerExperience.feedback.feedbackFor', { playerName })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`feedback-${playerId}`}>
            {t('playerExperience.feedback.yourFeedback')}
          </Label>
          <Textarea
            id={`feedback-${playerId}`}
            placeholder={t('playerExperience.feedback.feedbackPlaceholder')}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isSaving}
            rows={3}
            className="min-h-[80px]"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || !feedback.trim()} size="sm">
            {isSaving ? t('common.messages.saving') : t('common.buttons.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
