import { TeamOverviewTab } from '@/components/reports/TeamOverviewTab';
import { PlayerRankingsTab } from '@/components/reports/PlayerRankingsTab';
import { DrillEffectivenessTab } from '@/components/reports/DrillEffectivenessTab';
import type { DateRange } from '@/services/analytics.service';

interface ReportsTeamTabProps {
  teamId: string;
  dateRange?: DateRange;
}

export function ReportsTeamTab({ teamId, dateRange }: ReportsTeamTabProps) {
  return (
    <div className="space-y-8">
      <TeamOverviewTab teamId={teamId} dateRange={dateRange} />
      <PlayerRankingsTab teamId={teamId} dateRange={dateRange} />
      <DrillEffectivenessTab teamId={teamId} dateRange={dateRange} />
    </div>
  );
}
