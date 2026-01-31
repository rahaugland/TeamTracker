import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { getEvent } from '@/services/events.service';
import { getEventAttendance } from '@/services/attendance.service';
import { getPlayersByTeam } from '@/services/players.service';
import {
  getStatEntriesForEvent,
  createStatEntry,
  updateStatEntry,
} from '@/services/player-stats.service';
import type { EventWithDetails } from '@/services/events.service';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { StatEntry } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * RecordStatsPage component
 * Spreadsheet-style stat recording interface for games and tournaments
 */

interface PlayerStatRow {
  playerId: string;
  playerName: string;
  statEntryId?: string;
  kills: number;
  attackErrors: number;
  attackAttempts: number;
  aces: number;
  serviceErrors: number;
  serveAttempts: number;
  digs: number;
  blockSolos: number;
  blockAssists: number;
  ballHandlingErrors: number;
  passAttempts: number;
  passSum: number;
  blockTouches: number;
  setAttempts: number;
  setSum: number;
  settingErrors: number;
  setsPlayed: number;
  rotationsPlayed: number;
  rotation: number | null;
}

export function RecordStatsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecordWithPlayer[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<PlayerWithMemberships[]>([]);
  const [statEntries, setStatEntries] = useState<StatEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  useEffect(() => {
    if (id) {
      loadEventData(id);
    }
  }, [id]);

  const loadEventData = async (eventId: string) => {
    setIsLoading(true);
    try {
      const [eventData, attendanceData] = await Promise.all([
        getEvent(eventId),
        getEventAttendance(eventId),
      ]);

      if (eventData) {
        setEvent(eventData);
        setAttendance(attendanceData);

        const players = await getPlayersByTeam(eventData.team_id);
        setTeamPlayers(players);

        const stats = await getStatEntriesForEvent(eventId);
        setStatEntries(stats);

        initializePlayerStats(players, attendanceData, stats);
      }
    } catch (err) {
      console.error('Error loading event data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initializePlayerStats = (
    players: PlayerWithMemberships[],
    attendanceRecords: AttendanceRecordWithPlayer[],
    stats: StatEntry[]
  ) => {
    const attendedPlayerIds = attendanceRecords
      .filter((record) => record.status === 'present' || record.status === 'late')
      .map((record) => record.player_id);

    const attendedPlayers = players.filter((player) =>
      attendedPlayerIds.includes(player.id)
    );

    const rows: PlayerStatRow[] = attendedPlayers.map((player) => {
      const existingEntry = stats.find((entry) => entry.player_id === player.id);

      return {
        playerId: player.id,
        playerName: player.name,
        statEntryId: existingEntry?.id,
        kills: existingEntry?.kills || 0,
        attackErrors: existingEntry?.attack_errors || 0,
        attackAttempts: existingEntry?.attack_attempts || 0,
        aces: existingEntry?.aces || 0,
        serviceErrors: existingEntry?.service_errors || 0,
        serveAttempts: existingEntry?.serve_attempts || 0,
        digs: existingEntry?.digs || 0,
        blockSolos: existingEntry?.block_solos || 0,
        blockAssists: existingEntry?.block_assists || 0,
        ballHandlingErrors: existingEntry?.ball_handling_errors || 0,
        passAttempts: existingEntry?.pass_attempts || 0,
        passSum: existingEntry?.pass_sum || 0,
        blockTouches: existingEntry?.block_touches || 0,
        setAttempts: existingEntry?.set_attempts || 0,
        setSum: existingEntry?.set_sum || 0,
        settingErrors: existingEntry?.setting_errors || 0,
        setsPlayed: existingEntry?.sets_played || 0,
        rotationsPlayed: existingEntry?.rotations_played || 0,
        rotation: existingEntry?.rotation ?? null,
      };
    });

    setPlayerStats(rows);
  };

  const handleStatChange = (playerId: string, field: keyof PlayerStatRow, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setPlayerStats((prev) =>
      prev.map((row) =>
        row.playerId === playerId ? { ...row, [field]: Math.max(0, numValue) } : row
      )
    );
  };

  const handleSaveRow = async (playerId: string) => {
    if (!id || !user?.id) return;

    setSavingPlayerId(playerId);
    try {
      const row = playerStats.find((r) => r.playerId === playerId);
      if (!row) return;

      const statData = {
        kills: row.kills,
        attack_errors: row.attackErrors,
        attack_attempts: row.attackAttempts,
        aces: row.aces,
        service_errors: row.serviceErrors,
        serve_attempts: row.serveAttempts,
        digs: row.digs,
        block_solos: row.blockSolos,
        block_assists: row.blockAssists,
        ball_handling_errors: row.ballHandlingErrors,
        pass_attempts: row.passAttempts,
        pass_sum: row.passSum,
        block_touches: row.blockTouches,
        set_attempts: row.setAttempts,
        set_sum: row.setSum,
        setting_errors: row.settingErrors,
        sets_played: row.setsPlayed,
        rotations_played: row.rotationsPlayed,
        rotation: (row.rotation as 1 | 2 | 3 | 4 | 5 | 6 | undefined) ?? undefined,
      };

      if (row.statEntryId) {
        await updateStatEntry(row.statEntryId, statData);
      } else {
        const created = await createStatEntry({
          player_id: playerId,
          event_id: id,
          ...statData,
          recorded_by: user.id,
        });
        setPlayerStats((prev) =>
          prev.map((r) =>
            r.playerId === playerId ? { ...r, statEntryId: created.id } : r
          )
        );
      }

      const stats = await getStatEntriesForEvent(id);
      setStatEntries(stats);
    } catch (err) {
      console.error('Error saving player stats:', err);
    } finally {
      setSavingPlayerId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!id || !user?.id) return;

    setIsSaving(true);
    try {
      for (const row of playerStats) {
        const statData = {
          kills: row.kills,
          attack_errors: row.attackErrors,
          attack_attempts: row.attackAttempts,
          aces: row.aces,
          service_errors: row.serviceErrors,
          serve_attempts: row.serveAttempts,
          digs: row.digs,
          block_solos: row.blockSolos,
          block_assists: row.blockAssists,
          ball_handling_errors: row.ballHandlingErrors,
          pass_attempts: row.passAttempts,
          pass_sum: row.passSum,
          block_touches: row.blockTouches,
          set_attempts: row.setAttempts,
          set_sum: row.setSum,
          setting_errors: row.settingErrors,
          sets_played: row.setsPlayed,
          rotations_played: row.rotationsPlayed,
          rotation: (row.rotation as 1 | 2 | 3 | 4 | 5 | 6 | undefined) ?? undefined,
        };

        if (row.statEntryId) {
          await updateStatEntry(row.statEntryId, statData);
        } else {
          const created = await createStatEntry({
            player_id: row.playerId,
            event_id: id,
            ...statData,
            recorded_by: user.id,
          });
          setPlayerStats((prev) =>
            prev.map((r) =>
              r.playerId === row.playerId ? { ...r, statEntryId: created.id } : r
            )
          );
        }
      }

      const stats = await getStatEntriesForEvent(id);
      setStatEntries(stats);
    } catch (err) {
      console.error('Error saving all stats:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateKillPercentage = (row: PlayerStatRow): string => {
    if (row.attackAttempts === 0) return '-';
    const killPct = ((row.kills - row.attackErrors) / row.attackAttempts) * 100;
    return killPct.toFixed(1) + '%';
  };

  const calculateTeamTotals = () => {
    return playerStats.reduce(
      (totals, row) => ({
        kills: totals.kills + row.kills,
        attackErrors: totals.attackErrors + row.attackErrors,
        attackAttempts: totals.attackAttempts + row.attackAttempts,
        aces: totals.aces + row.aces,
        serviceErrors: totals.serviceErrors + row.serviceErrors,
        serveAttempts: totals.serveAttempts + row.serveAttempts,
        digs: totals.digs + row.digs,
        blockSolos: totals.blockSolos + row.blockSolos,
        blockAssists: totals.blockAssists + row.blockAssists,
        blockTouches: totals.blockTouches + row.blockTouches,
        setAttempts: totals.setAttempts + row.setAttempts,
        setSum: totals.setSum + row.setSum,
        settingErrors: totals.settingErrors + row.settingErrors,
        ballHandlingErrors: totals.ballHandlingErrors + row.ballHandlingErrors,
        passAttempts: totals.passAttempts + row.passAttempts,
        passSum: totals.passSum + row.passSum,
        setsPlayed: totals.setsPlayed + row.setsPlayed,
        rotationsPlayed: totals.rotationsPlayed + row.rotationsPlayed,
      }),
      {
        kills: 0,
        attackErrors: 0,
        attackAttempts: 0,
        aces: 0,
        serviceErrors: 0,
        serveAttempts: 0,
        digs: 0,
        blockSolos: 0,
        blockAssists: 0,
        blockTouches: 0,
        setAttempts: 0,
        setSum: 0,
        settingErrors: 0,
        ballHandlingErrors: 0,
        passAttempts: 0,
        passSum: 0,
        setsPlayed: 0,
        rotationsPlayed: 0,
      }
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('event.notFound')}</p>
      </div>
    );
  }

  if (!isCoach) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('users.noPermission')}</p>
      </div>
    );
  }

  if (event.is_finalized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">{t('awards.gameFinalized')}</p>
        <Button variant="outline" onClick={() => navigate(`/events/${id}`)}>
          {t('common.buttons.back')}
        </Button>
      </div>
    );
  }

  const totals = calculateTeamTotals();

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate(`/events/${id}`)} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('stats.recordStats')}</h1>
        <p className="text-muted-foreground">
          {event.title} - {formatDateTime(event.start_time)}
        </p>
        {event.opponent && (
          <p className="text-muted-foreground">vs {event.opponent}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('stats.recordStats')}</CardTitle>
              <CardDescription>
                {playerStats.length === 0
                  ? t('attendance.noPlayers')
                  : `${playerStats.length} ${t('player.plural').toLowerCase()}`}
              </CardDescription>
            </div>
            <Button onClick={handleSaveAll} disabled={isSaving || playerStats.length === 0}>
              {isSaving ? t('common.messages.saving') : t('stats.saveAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {playerStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('attendance.noPlayers')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] sticky left-0 z-20 bg-primary/5">
                      {t('player.singular')}
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.kills')} (K)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.attackErrors')} (E)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.attackAttempts')} (TA)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">K%</TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.aces')}
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.serviceErrors')} (SE)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.serveAttempts')} (SA)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.digs')}
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.blockSolos')} (BS)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.blockAssists')} (BA)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.blockTouches')} (BT)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.ballHandlingErrors')} (BHE)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.passAttempts')} (PA)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.passSum')} (PS)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.setAttempts')} (SA)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.setSum')} (SS)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.settingErrors')} (SE)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.rotation')} (R)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.setsPlayed')} (SP)
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      {t('stats.fields.rotationsPlayed')} (RP)
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      {t('common.labels.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats.map((row) => (
                    <TableRow key={row.playerId}>
                      <TableCell className="font-medium sticky left-0 z-10 bg-white">
                        {row.playerName}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.kills}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'kills', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.attackErrors}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'attackErrors', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.attackAttempts}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'attackAttempts', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {calculateKillPercentage(row)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.aces}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'aces', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.serviceErrors}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'serviceErrors', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.serveAttempts}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'serveAttempts', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.digs}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'digs', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.blockSolos}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'blockSolos', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.blockAssists}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'blockAssists', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.blockTouches}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'blockTouches', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.ballHandlingErrors}
                          onChange={(e) =>
                            handleStatChange(
                              row.playerId,
                              'ballHandlingErrors',
                              e.target.value
                            )
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.passAttempts}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'passAttempts', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.passSum}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'passSum', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.setAttempts}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'setAttempts', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.setSum}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'setSum', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.settingErrors}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'settingErrors', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.rotation?.toString() ?? 'none'}
                          onValueChange={(val) => {
                            const numVal = val === 'none' ? null : parseInt(val);
                            setPlayerStats((prev) =>
                              prev.map((r) =>
                                r.playerId === row.playerId ? { ...r, rotation: numVal } : r
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.setsPlayed}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'setsPlayed', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.rotationsPlayed}
                          onChange={(e) =>
                            handleStatChange(row.playerId, 'rotationsPlayed', e.target.value)
                          }
                          className="w-20 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveRow(row.playerId)}
                          disabled={savingPlayerId === row.playerId}
                        >
                          {savingPlayerId === row.playerId
                            ? t('common.messages.saving')
                            : t('common.buttons.save')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold sticky left-0 z-10 bg-muted/50">
                      {t('stats.teamTotals')}
                    </TableCell>
                    <TableCell className="text-center font-bold">{totals.kills}</TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.attackErrors}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.attackAttempts}
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm">
                      {totals.attackAttempts > 0
                        ? (
                            ((totals.kills - totals.attackErrors) /
                              totals.attackAttempts) *
                            100
                          ).toFixed(1) + '%'
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center font-bold">{totals.aces}</TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.serviceErrors}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.serveAttempts}
                    </TableCell>
                    <TableCell className="text-center font-bold">{totals.digs}</TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.blockSolos}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.blockAssists}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.blockTouches}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.ballHandlingErrors}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {totals.passAttempts}
                    </TableCell>
                    <TableCell className="text-center font-bold">{totals.passSum}</TableCell>
                    <TableCell className="text-center font-bold">{totals.setAttempts}</TableCell>
                    <TableCell className="text-center font-bold">{totals.setSum}</TableCell>
                    <TableCell className="text-center font-bold">{totals.settingErrors}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-center font-bold">{totals.setsPlayed}</TableCell>
                    <TableCell className="text-center font-bold">{totals.rotationsPlayed}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
