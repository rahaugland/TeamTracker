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
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Current Streak</p>
                <p className="text-xs text-blue-700">Consecutive events attended</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.currentStreak}</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">Longest Streak</p>
                <p className="text-xs text-amber-700">Personal best</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-600">{stats.longestStreak}</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Attendance Rate</p>
                <p className="text-xs text-green-700">{stats.attended} of {stats.totalEvents} events</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">{attendancePercent}%</div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-700">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-700">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-700">{stats.excused}</p>
              <p className="text-xs text-muted-foreground">Excused</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-purple-700">{stats.notSelected}</p>
              <p className="text-xs text-muted-foreground">Not Selected</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
