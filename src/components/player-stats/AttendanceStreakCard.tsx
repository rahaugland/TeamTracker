import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Target, Calendar } from 'lucide-react';
import type { AttendanceStats } from '@/services/player-stats.service';

interface AttendanceStreakCardProps {
  stats: AttendanceStats;
}

/**
 * Card showing current streak, longest streak, and attendance rate
 */
export function AttendanceStreakCard({ stats }: AttendanceStreakCardProps) {
  const attendancePercent = (stats.attendanceRate * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-vq-teal/10 rounded-lg border border-vq-teal/20">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-vq-teal" />
              <div>
                <p className="text-sm font-medium text-foreground">Current Streak</p>
                <p className="text-xs text-muted-foreground">Consecutive events attended</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-stat text-vq-teal">{stats.currentStreak}</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-club-secondary/10 rounded-lg border border-club-secondary/20">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-club-secondary" />
              <div>
                <p className="text-sm font-medium text-foreground">Longest Streak</p>
                <p className="text-xs text-muted-foreground">Personal best</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-stat text-club-secondary">{stats.longestStreak}</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-emerald-400/10 rounded-lg border border-emerald-400/20">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Attendance Rate</p>
                <p className="text-xs text-muted-foreground">{stats.attended} of {stats.totalEvents} events</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-stat text-emerald-400">{attendancePercent}%</div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-semibold text-stat text-club-secondary">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-stat text-club-primary">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-stat text-vq-teal">{stats.excused}</p>
              <p className="text-xs text-muted-foreground">Excused</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-stat text-purple-400">{stats.notSelected}</p>
              <p className="text-xs text-muted-foreground">Not Selected</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
