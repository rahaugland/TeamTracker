import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import type { FeedbackWithAuthor } from '@/services/player-feedback.service';

interface FeedbackTimelineProps {
  feedback: FeedbackWithAuthor[];
}

export function FeedbackTimeline({ feedback }: FeedbackTimelineProps) {
  const { t } = useTranslation();

  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t('playerExperience.feedback.noFeedback')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <Card key={item.id} className="border-l-4 border-primary">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{item.event.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3 whitespace-pre-wrap">{item.content}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">{item.author.full_name}</span>
              <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
