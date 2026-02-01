import { useState, useEffect, useCallback } from 'react';
import {
  getPlayerFeedback,
  getPlayerReviews,
  getPlayerSkillRatings
} from '@/services/player-feedback.service';
import type { FeedbackWithAuthor, ReviewWithAuthor } from '@/services/player-feedback.service';
import type { SkillRating } from '@/types/database.types';

export function usePlayerFeedback(playerId: string | undefined) {
  const [feedback, setFeedback] = useState<FeedbackWithAuthor[]>([]);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [skillRatings, setSkillRatings] = useState<SkillRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlayerFeedback = useCallback(async () => {
    if (!playerId) {
      setFeedback([]);
      setReviews([]);
      setSkillRatings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [feedbackResult, reviewsResult, skillRatingsResult] = await Promise.all([
        getPlayerFeedback(playerId),
        getPlayerReviews(playerId),
        getPlayerSkillRatings(playerId)
      ]);

      setFeedback(feedbackResult);
      setReviews(reviewsResult);
      setSkillRatings(skillRatingsResult);
    } catch (error) {
      console.error('Error fetching player feedback:', error);
      setFeedback([]);
      setReviews([]);
      setSkillRatings([]);
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayerFeedback();
  }, [fetchPlayerFeedback]);

  return {
    feedback,
    reviews,
    skillRatings,
    isLoading,
    refetch: fetchPlayerFeedback
  };
}
