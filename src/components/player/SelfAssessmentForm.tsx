import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star } from 'lucide-react';
import type { Event } from '@/types/database.types';
import type { SelfAssessmentWithEvent, CreateSelfAssessmentInput } from '@/services/self-assessment.service';

interface SelfAssessmentFormProps {
  events: Event[];
  playerId: string;
  existingAssessments: SelfAssessmentWithEvent[];
  onSubmit: (input: CreateSelfAssessmentInput) => Promise<void>;
}

export function SelfAssessmentForm({
  events,
  playerId,
  existingAssessments,
  onSubmit,
}: SelfAssessmentFormProps) {
  const { t } = useTranslation();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assessedEventIds = new Set(existingAssessments.map(a => a.event_id));
  const availableEvents = events.filter(e => !assessedEventIds.has(e.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        player_id: playerId,
        event_id: selectedEventId,
        rating,
        notes: notes.trim() || undefined,
      });
      setSelectedEventId('');
      setRating(0);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (availableEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.selfAssessment.noEventsToRate')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playerExperience.selfAssessment.formTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-select">
              {t('playerExperience.selfAssessment.selectEvent')}
            </Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger id="event-select">
                <SelectValue placeholder={t('playerExperience.selfAssessment.selectEventPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('playerExperience.selfAssessment.rating')}</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      value <= rating
                        ? 'fill-club-secondary text-club-secondary'
                        : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {t('playerExperience.selfAssessment.notes')}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('playerExperience.selfAssessment.notesPlaceholder')}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={!selectedEventId || rating === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t('common.messages.saving') : t('common.buttons.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
