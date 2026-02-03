import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { markAttendance } from '@/services/attendance.service';
import type { AttendanceStatus, RsvpStatus } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import type { RsvpWithPlayer } from '@/services/rsvp.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * AttendanceTracker component
 * Allows coaches to mark player attendance for an event
 * Features:
 * - Shows all team players with their RSVP status
 * - Quick attendance marking with status badges
 * - Mark all present functionality
 * - Auto-save with debouncing
 * - Attendance summary
 */

interface AttendanceTrackerProps {
  eventId: string;
  teamPlayers: PlayerWithMemberships[];
  attendance: AttendanceRecordWithPlayer[];
  rsvps: RsvpWithPlayer[];
  onAttendanceChange: () => void;
  isCoach: boolean;
}

interface PendingUpdate {
  playerId: string;
  status: AttendanceStatus;
}

export function AttendanceTracker({
  eventId,
  teamPlayers,
  attendance,
  rsvps,
  onAttendanceChange,
  isCoach,
}: AttendanceTrackerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PendingUpdate>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState<number | null>(null);

  // Get RSVP status for a player
  const getRSVPStatus = (playerId: string): RsvpStatus => {
    const rsvp = rsvps.find((r) => r.player_id === playerId);
    return rsvp?.status || 'pending';
  };

  // Get attendance status for a player
  const getAttendanceStatus = (playerId: string): AttendanceStatus | undefined => {
    // Check pending updates first
    const pending = pendingUpdates.get(playerId);
    if (pending) {
      return pending.status;
    }
    // Otherwise check saved attendance
    const record = attendance.find((a) => a.player_id === playerId);
    return record?.status;
  };

  // Get RSVP badge color
  const getRSVPBadgeColor = (status: RsvpStatus): string => {
    const colors: Record<RsvpStatus, string> = {
      attending: 'bg-emerald-500/15 text-emerald-400',
      not_attending: 'bg-club-primary/15 text-club-primary',
      maybe: 'bg-club-secondary/15 text-club-secondary',
      pending: 'bg-white/10 text-muted-foreground',
    };
    return colors[status];
  };

  // Get attendance badge color
  const getAttendanceBadgeColor = (status: AttendanceStatus): string => {
    const colors: Record<AttendanceStatus, string> = {
      present: 'bg-emerald-500 text-white',
      absent: 'bg-club-primary text-white',
      late: 'bg-club-secondary text-white',
      excused: 'bg-vq-teal text-white',
      not_selected: 'bg-purple-500 text-white',
    };
    return colors[status];
  };

  // Calculate attendance summary
  const getAttendanceSummary = () => {
    const summary = {
      total: teamPlayers.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      not_selected: 0,
      notMarked: 0,
    };

    teamPlayers.forEach((player) => {
      const status = getAttendanceStatus(player.id);
      if (status) {
        summary[status]++;
      } else {
        summary.notMarked++;
      }
    });

    return summary;
  };

  // Save pending updates to the server
  const savePendingUpdates = useCallback(async () => {
    if (!user?.id || pendingUpdates.size === 0) return;

    setIsSaving(true);
    try {
      // Save all pending updates
      const updates = Array.from(pendingUpdates.values());
      await Promise.all(
        updates.map((update) =>
          markAttendance({
            event_id: eventId,
            player_id: update.playerId,
            status: update.status,
            recorded_by: user.id,
          })
        )
      );

      // Clear pending updates after successful save
      setPendingUpdates(new Map());

      // Notify parent component to reload data
      onAttendanceChange();
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setIsSaving(false);
    }
  }, [eventId, user, pendingUpdates, onAttendanceChange]);

  // Debounced auto-save
  useEffect(() => {
    if (pendingUpdates.size > 0) {
      // Clear existing timeout
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }

      // Set new timeout
      const timeoutId = window.setTimeout(() => {
        savePendingUpdates();
      }, 1500); // 1.5 second debounce

      setSaveTimeoutId(timeoutId);
    }

    // Cleanup
    return () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
    };
  }, [pendingUpdates, savePendingUpdates]);

  // Handle attendance change
  const handleAttendanceChange = (playerId: string, status: AttendanceStatus) => {
    if (!isCoach) return;

    const newPendingUpdates = new Map(pendingUpdates);
    newPendingUpdates.set(playerId, { playerId, status });
    setPendingUpdates(newPendingUpdates);
  };

  // Mark all players as present
  const handleMarkAllPresent = () => {
    if (!isCoach) return;

    const newPendingUpdates = new Map<string, PendingUpdate>();
    teamPlayers.forEach((player) => {
      newPendingUpdates.set(player.id, {
        playerId: player.id,
        status: 'present',
      });
    });
    setPendingUpdates(newPendingUpdates);
  };

  const summary = getAttendanceSummary();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('attendance.title')}</CardTitle>
            <CardDescription>
              {t('attendance.summary', {
                present: summary.present,
                total: summary.total,
              })}
            </CardDescription>
          </div>
          {isCoach && (
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-sm text-muted-foreground">
                  {t('common.messages.saving')}
                </span>
              )}
              {pendingUpdates.size > 0 && !isSaving && (
                <span className="text-sm text-muted-foreground">
                  {t('attendance.unsavedChanges', { count: pendingUpdates.size })}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                disabled={isSaving}
              >
                {t('attendance.markAllPresent')}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {teamPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('attendance.noPlayers')}
            </p>
          ) : (
            teamPlayers.map((player) => {
              const playerStatus = getAttendanceStatus(player.id);
              const rsvpStatus = getRSVPStatus(player.id);

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Player avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {t('attendance.rsvp')}:
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getRSVPBadgeColor(
                            rsvpStatus
                          )}`}
                        >
                          {t(`rsvp.status.${rsvpStatus}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance status */}
                  <div className="flex items-center gap-2">
                    {playerStatus && (
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getAttendanceBadgeColor(
                          playerStatus
                        )}`}
                      >
                        {t(`attendance.status.${playerStatus}`)}
                      </span>
                    )}

                    {isCoach ? (
                      <Select
                        value={playerStatus || 'none'}
                        onValueChange={(value) => {
                          if (value !== 'none') {
                            handleAttendanceChange(player.id, value as AttendanceStatus);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder={t('attendance.markAttendance')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('attendance.notMarked')}</SelectItem>
                          <SelectItem value="present">{t('attendance.status.present')}</SelectItem>
                          <SelectItem value="absent">{t('attendance.status.absent')}</SelectItem>
                          <SelectItem value="late">{t('attendance.status.late')}</SelectItem>
                          <SelectItem value="excused">{t('attendance.status.excused')}</SelectItem>
                          <SelectItem value="not_selected">{t('attendance.status.not_selected')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      !playerStatus && (
                        <span className="text-sm text-muted-foreground">
                          {t('attendance.notMarked')}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary statistics */}
        {teamPlayers.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <p className="text-2xl font-bold text-stat text-emerald-400">{summary.present}</p>
                <p className="text-xs text-emerald-400">{t('attendance.status.present')}</p>
              </div>
              <div className="p-2 rounded-lg bg-club-primary/10">
                <p className="text-2xl font-bold text-stat text-club-primary">{summary.absent}</p>
                <p className="text-xs text-club-primary">{t('attendance.status.absent')}</p>
              </div>
              <div className="p-2 rounded-lg bg-club-secondary/10">
                <p className="text-2xl font-bold text-stat text-club-secondary">{summary.late}</p>
                <p className="text-xs text-club-secondary">{t('attendance.status.late')}</p>
              </div>
              <div className="p-2 rounded-lg bg-vq-teal/10">
                <p className="text-2xl font-bold text-stat text-vq-teal">{summary.excused}</p>
                <p className="text-xs text-vq-teal">{t('attendance.status.excused')}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <p className="text-2xl font-bold text-stat text-purple-400">{summary.not_selected}</p>
                <p className="text-xs text-purple-400">{t('attendance.status.not_selected')}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-stat text-muted-foreground">{summary.notMarked}</p>
                <p className="text-xs text-muted-foreground">{t('attendance.notMarked')}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
