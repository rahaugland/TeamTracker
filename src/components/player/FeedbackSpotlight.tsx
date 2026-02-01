import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import type { FeedbackWithAuthor } from '@/services/player-feedback.service';

interface FeedbackSpotlightProps {
  feedback: FeedbackWithAuthor[];
}

export function FeedbackSpotlight({ feedback }: FeedbackSpotlightProps) {
  const { t } = useTranslation();

  if (feedback.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.progress.spotlightEmpty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const latest = feedback[0];

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Quote className="h-5 w-5 text-primary/60 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <blockquote className="border-l-4 border-primary/40 pl-4">
              <p className="text-sm whitespace-pre-wrap">{latest.content}</p>
            </blockquote>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="font-medium">{latest.author.full_name}</span>
              <span>&middot;</span>
              <span>{latest.event.title}</span>
              <span>&middot;</span>
              <span>{format(new Date(latest.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
