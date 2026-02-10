import { useState, useEffect } from 'react';
import { getTeamRating, getFormStreak, type TeamRating, type FormStreak } from '@/services/team-stats.service';
import { getTeamAttendanceRate, getPracticeFrequency, type TeamAttendanceRate, type PracticeFrequency, type DateRange } from '@/services/analytics.service';
import { getSeasonSummary, type SeasonSummaryData } from '@/services/team-seasons.service';

export interface TeamOverviewData {
  teamRating: TeamRating | null;
  formStreak: FormStreak | null;
  attendance: TeamAttendanceRate | null;
  practiceFrequency: PracticeFrequency | null;
  seasonSummary: SeasonSummaryData | null;
}

export function useTeamOverview(teamId: string | undefined, dateRange?: DateRange) {
  const [data, setData] = useState<TeamOverviewData>({
    teamRating: null,
    formStreak: null,
    attendance: null,
    practiceFrequency: null,
    seasonSummary: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getTeamRating(teamId).catch(() => null),
      getFormStreak(teamId).catch(() => null),
      getTeamAttendanceRate(teamId, dateRange).catch(() => null),
      getPracticeFrequency(teamId, dateRange).catch(() => null),
      dateRange
        ? getSeasonSummary(teamId, dateRange.startDate, dateRange.endDate).catch(() => null)
        : Promise.resolve(null),
    ]).then(([teamRating, formStreak, attendance, practiceFrequency, seasonSummary]) => {
      if (!cancelled) {
        setData({ teamRating, formStreak, attendance, practiceFrequency, seasonSummary });
        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load team overview');
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [teamId, dateRange?.startDate, dateRange?.endDate]);

  return { ...data, isLoading, error };
}
