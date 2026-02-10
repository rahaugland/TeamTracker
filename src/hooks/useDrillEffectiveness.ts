import { useState, useEffect } from 'react';
import {
  getDrillEffectiveness,
  getTeamTrainingVolume,
  getDrillProgression,
  type DrillEffectivenessEntry,
  type SkillTrainingVolume,
  type DrillProgressionEntry,
} from '@/services/reports.service';
import { getTopDrills, type DrillUsage, type DateRange } from '@/services/analytics.service';

export interface DrillEffectivenessData {
  drills: DrillEffectivenessEntry[];
  topDrills: DrillUsage[];
  trainingVolume: SkillTrainingVolume[];
  progression: DrillProgressionEntry[];
}

export function useDrillEffectiveness(teamId: string | undefined, dateRange?: DateRange) {
  const [data, setData] = useState<DrillEffectivenessData>({
    drills: [],
    topDrills: [],
    trainingVolume: [],
    progression: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getDrillEffectiveness(teamId, dateRange).catch(() => []),
      getTopDrills(teamId, 10, dateRange).catch(() => []),
      getTeamTrainingVolume(teamId, dateRange).catch(() => []),
      getDrillProgression(teamId, dateRange).catch(() => []),
    ]).then(([drills, topDrills, trainingVolume, progression]) => {
      if (!cancelled) {
        setData({ drills, topDrills, trainingVolume, progression });
        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load drill data');
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [teamId, dateRange?.startDate, dateRange?.endDate]);

  return { ...data, isLoading, error };
}
