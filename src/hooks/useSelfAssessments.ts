import { useState, useEffect, useCallback } from 'react';
import {
  getPlayerSelfAssessments,
  createSelfAssessment
} from '@/services/self-assessment.service';
import type { SelfAssessmentWithEvent, CreateSelfAssessmentInput } from '@/services/self-assessment.service';

export function useSelfAssessments(playerId: string | undefined) {
  const [assessments, setAssessments] = useState<SelfAssessmentWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSelfAssessments = useCallback(async () => {
    if (!playerId) {
      setAssessments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getPlayerSelfAssessments(playerId);
      setAssessments(result);
    } catch (error) {
      console.error('Error fetching self assessments:', error);
      setAssessments([]);
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  const submitAssessment = useCallback(async (input: CreateSelfAssessmentInput) => {
    try {
      await createSelfAssessment(input);
      await fetchSelfAssessments();
    } catch (error) {
      console.error('Error creating self assessment:', error);
      throw error;
    }
  }, [fetchSelfAssessments]);

  useEffect(() => {
    fetchSelfAssessments();
  }, [fetchSelfAssessments]);

  return {
    assessments,
    isLoading,
    submitAssessment,
    refetch: fetchSelfAssessments
  };
}
