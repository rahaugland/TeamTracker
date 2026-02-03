import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { AttendanceRecord, Event } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PlayerAttendanceHistoryProps {
  attendanceRecords: (AttendanceRecord & { event?: Event })[];
  totalEvents?: number;
}

/**
 * Player attendance history component
 * Shows player's attendance records and attendance rate
 */
export function PlayerAttendanceHistory({
  attendanceRecords,
  totalEvents = 0,
}: PlayerAttendanceHistoryProps) {
  const { t } = useTranslation();

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;
  const excusedCount = attendanceRecords.filter((r) => r.status === 'excused').length;

  const attendanceRate =
    totalEvents > 0 ? Math.round(((presentCount + lateCount) / totalEvents) * 100) : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'late':
        return <Clock className="w-4 h-4 text-club-secondary" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-club-primary" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-vq-teal" />;
      case 'not_selected':
        return <XCircle className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'late':
        return 'bg-club-secondary/15 text-club-secondary';
      case 'absent':
        return 'bg-club-primary/15 text-club-primary';
      case 'excused':
        return 'bg-vq-teal/15 text-vq-teal';
      case 'not_selected':
        return 'bg-purple-500/15 text-purple-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('player.attendance')}</CardTitle>
          <CardDescription>
            {t('attendance.summary', {
              present: presentCount + lateCount,
              total: totalEvents,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t('dashboard.widgets.averageAttendance')}
              </span>
              <span className="text-2xl text-stat font-bold">{attendanceRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl text-stat font-bold text-emerald-400">
                {presentCount}
              </div>
              <div className="text-xs text-emerald-400/80">
                {t('attendance.status.present')}
              </div>
            </div>

            <div className="text-center p-3 bg-club-secondary/10 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-5 h-5 text-club-secondary" />
              </div>
              <div className="text-2xl text-stat font-bold text-club-secondary">
                {lateCount}
              </div>
              <div className="text-xs text-club-secondary/80">
                {t('attendance.status.late')}
              </div>
            </div>

            <div className="text-center p-3 bg-club-primary/10 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <XCircle className="w-5 h-5 text-club-primary" />
              </div>
              <div className="text-2xl text-stat font-bold text-club-primary">
                {absentCount}
              </div>
              <div className="text-xs text-club-primary/80">
                {t('attendance.status.absent')}
              </div>
            </div>

            <div className="text-center p-3 bg-vq-teal/10 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="w-5 h-5 text-vq-teal" />
              </div>
              <div className="text-2xl text-stat font-bold text-vq-teal">
                {excusedCount}
              </div>
              <div className="text-xs text-vq-teal/80">
                {t('attendance.status.excused')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.widgets.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceRecords.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {record.event?.title || 'Event'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.created_at && format(new Date(record.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {t(`attendance.status.${record.status}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
