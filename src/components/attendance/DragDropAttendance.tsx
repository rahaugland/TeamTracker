import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AttendanceStatus, EventType } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import { DroppableColumn } from './DroppableColumn';
import { DraggablePlayerCard } from './DraggablePlayerCard';

interface DragDropAttendanceProps {
  eventId: string;
  eventType: EventType;
  teamPlayers: PlayerWithMemberships[];
  initialAttendance: AttendanceRecordWithPlayer[];
  onSave: (changes: Map<string, AttendanceStatus>) => Promise<void>;
  isCoach: boolean;
}

type ColumnId = AttendanceStatus | 'unmarked' | 'available' | 'playing';

interface ColumnDefinition {
  id: ColumnId;
  title: string;
  bgColor: string;
  textColor: string;
}

export function DragDropAttendance({
  eventId,
  eventType,
  teamPlayers,
  initialAttendance,
  onSave,
  isCoach,
}: DragDropAttendanceProps) {
  const { t } = useTranslation();
  const [localChanges, setLocalChanges] = useState<Map<string, AttendanceStatus>>(new Map());
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Determine if this is a game/tournament (simplified view)
  const isGameMode = eventType === 'game' || eventType === 'tournament';

  // Define columns based on event type
  const columns: ColumnDefinition[] = useMemo(() => {
    if (isGameMode) {
      return [
        {
          id: 'available',
          title: t('attendance.columnsTitle.available'),
          bgColor: 'bg-white/5',
          textColor: 'text-muted-foreground',
        },
        {
          id: 'playing',
          title: t('attendance.columnsTitle.playing'),
          bgColor: 'bg-emerald-500/10',
          textColor: 'text-emerald-400',
        },
        {
          id: 'not_selected',
          title: t('attendance.status.not_selected'),
          bgColor: 'bg-purple-500/10',
          textColor: 'text-purple-400',
        },
      ];
    }

    return [
      {
        id: 'unmarked',
        title: t('attendance.columnsTitle.unmarked'),
        bgColor: 'bg-white/5',
        textColor: 'text-muted-foreground',
      },
      {
        id: 'present',
        title: t('attendance.status.present'),
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
      },
      {
        id: 'late',
        title: t('attendance.status.late'),
        bgColor: 'bg-club-secondary/10',
        textColor: 'text-club-secondary',
      },
      {
        id: 'absent',
        title: t('attendance.status.absent'),
        bgColor: 'bg-club-primary/10',
        textColor: 'text-club-primary',
      },
      {
        id: 'excused',
        title: t('attendance.status.excused'),
        bgColor: 'bg-vq-teal/10',
        textColor: 'text-vq-teal',
      },
      {
        id: 'not_selected',
        title: t('attendance.status.not_selected'),
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-400',
      },
    ];
  }, [isGameMode, t]);

  // Get current status for a player (including local changes)
  const getPlayerStatus = (playerId: string): ColumnId => {
    // Check local changes first
    if (localChanges.has(playerId)) {
      const status = localChanges.get(playerId)!;

      // In game mode, map present/late to "playing"
      if (isGameMode) {
        if (status === 'present' || status === 'late') return 'playing';
        if (status === 'not_selected') return 'not_selected';
        return 'available';
      }

      return status;
    }

    // Check initial attendance
    const record = initialAttendance.find((a) => a.player_id === playerId);
    if (record) {
      // In game mode, map present/late to "playing"
      if (isGameMode) {
        if (record.status === 'present' || record.status === 'late') return 'playing';
        if (record.status === 'not_selected') return 'not_selected';
        return 'available';
      }

      return record.status;
    }

    // Default to unmarked/available
    return isGameMode ? 'available' : 'unmarked';
  };

  // Get players in a specific column
  const getPlayersInColumn = (columnId: ColumnId): PlayerWithMemberships[] => {
    return teamPlayers.filter((player) => getPlayerStatus(player.id) === columnId);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActivePlayerId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayerId(null);

    if (!over || !isCoach) return;

    const playerId = active.id as string;
    const newColumnId = over.id as ColumnId;

    // Don't update if dropped on unmarked/available (these are not valid statuses)
    let newStatus: AttendanceStatus;

    if (isGameMode) {
      // Map game mode columns to attendance statuses
      if (newColumnId === 'playing') {
        newStatus = 'present'; // Default playing to present
      } else if (newColumnId === 'not_selected') {
        newStatus = 'not_selected';
      } else {
        // Dropped on "available" - don't change status, remove from changes
        const newChanges = new Map(localChanges);
        newChanges.delete(playerId);
        setLocalChanges(newChanges);
        return;
      }
    } else {
      if (newColumnId === 'unmarked') {
        // Dropped on "unmarked" - remove from changes
        const newChanges = new Map(localChanges);
        newChanges.delete(playerId);
        setLocalChanges(newChanges);
        return;
      }
      newStatus = newColumnId as AttendanceStatus;
    }

    // Update local changes
    const newChanges = new Map(localChanges);
    newChanges.set(playerId, newStatus);
    setLocalChanges(newChanges);
  };

  // Handle save all
  const handleSaveAll = async () => {
    if (localChanges.size === 0) return;

    setIsSaving(true);
    try {
      await onSave(localChanges);
      setLocalChanges(new Map());
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setLocalChanges(new Map());
  };

  // Get active player for drag overlay
  const activePlayer = activePlayerId
    ? teamPlayers.find((p) => p.id === activePlayerId)
    : null;

  const hasChanges = localChanges.size > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>{t('attendance.title')}</CardTitle>
            <CardDescription>{t('attendance.dragInstruction')}</CardDescription>
          </div>
          {isCoach && (
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-sm text-muted-foreground">
                  {t('attendance.hasUnsavedChanges')}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                {t('common.buttons.reset')}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? t('common.messages.saving') : t('attendance.saveAll')}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {teamPlayers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('attendance.noPlayers')}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              className={`grid gap-4 ${
                isGameMode
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3'
              }`}
            >
              {columns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  bgColor={column.bgColor}
                  textColor={column.textColor}
                  count={getPlayersInColumn(column.id).length}
                  isDisabled={!isCoach}
                >
                  <div className="space-y-2 min-h-[120px]">
                    {getPlayersInColumn(column.id).map((player) => (
                      <DraggablePlayerCard
                        key={player.id}
                        player={player}
                        isDraggingDisabled={!isCoach}
                      />
                    ))}
                  </div>
                </DroppableColumn>
              ))}
            </div>

            <DragOverlay>
              {activePlayer ? (
                <div className="opacity-80">
                  <DraggablePlayerCard player={activePlayer} isDraggingDisabled={false} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
