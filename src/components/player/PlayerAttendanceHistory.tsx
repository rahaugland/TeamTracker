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
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'not_selected':
        return <XCircle className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'excused':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'not_selected':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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
              <span className="text-2xl font-bold">{attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {presentCount}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                {t('attendance.status.present')}
              </div>
            </div>

            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {lateCount}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-500">
                {t('attendance.status.late')}
              </div>
            </div>

            <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {absentCount}
              </div>
              <div className="text-xs text-red-600 dark:text-red-500">
                {t('attendance.status.absent')}
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {excusedCount}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-500">
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
