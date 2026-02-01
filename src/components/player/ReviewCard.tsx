import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReviewWithAuthor } from '@/services/player-feedback.service';

interface ReviewCardProps {
  review: ReviewWithAuthor;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">
              {t('playerExperience.reviews.reviewBy', { author: review.author?.full_name || 'Coach' })}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(review.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {review.strengths && (
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-green-900 dark:text-green-100">
                {t('playerExperience.reviews.strengths')}
              </h4>
              <p className="text-sm whitespace-pre-wrap">{review.strengths}</p>
            </div>
          )}
          {review.areas_to_improve && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-100">
                {t('playerExperience.reviews.areasToImprove')}
              </h4>
              <p className="text-sm whitespace-pre-wrap">{review.areas_to_improve}</p>
            </div>
          )}
          {review.goals_text && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                {t('playerExperience.reviews.goals')}
              </h4>
              <p className="text-sm whitespace-pre-wrap">{review.goals_text}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
