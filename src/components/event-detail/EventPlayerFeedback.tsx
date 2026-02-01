import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, MessageSquare, Check } from 'lucide-react';
import { createFeedback, getEventFeedback } from '@/services/player-feedback.service';
import type { FeedbackWithAuthor } from '@/services/player-feedback.service';
import type { PlayerWithMemberships } from '@/services/players.service';

interface EventPlayerFeedbackProps {
  eventId: string;
  teamPlayers: PlayerWithMemberships[];
  isCoach: boolean;
}

export function EventPlayerFeedback({ eventId, teamPlayers, isCoach }: EventPlayerFeedbackProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [existingFeedback, setExistingFeedback] = useState<FeedbackWithAuthor[]>([]);

  useEffect(() => {
    if (!collapsed) {
      loadExistingFeedback();
    }
  }, [collapsed, eventId]);

  const loadExistingFeedback = async () => {
    try {
      const data = await getEventFeedback(eventId);
      setExistingFeedback(data);
    } catch (error) {
      console.error('Error loading event feedback:', error);
    }
  };

  if (!isCoach) return null;

  const handleSave = async (playerId: string) => {
    const content = notes[playerId]?.trim();
    if (!content || !user?.id) return;

    setSaving((prev) => ({ ...prev, [playerId]: true }));
    try {
      await createFeedback({
        player_id: playerId,
        event_id: eventId,
        author_id: user.id,
        content,
      });
      setNotes((prev) => ({ ...prev, [playerId]: '' }));
      setSaved((prev) => ({ ...prev, [playerId]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [playerId]: false })), 2000);
      await loadExistingFeedback();
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setSaving((prev) => ({ ...prev, [playerId]: false }));
    }
  };

  const getExistingForPlayer = (playerId: string) =>
    existingFeedback.filter((f) => f.player_id === playerId);

  return (
    <Card className="mt-6">
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setCollapsed(!collapsed)}
      >
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('event.playerFeedback.title')}
        </CardTitle>
        {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {teamPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('event.playerFeedback.noPlayers')}</p>
          ) : (
            teamPlayers.map((player) => {
              const existing = getExistingForPlayer(player.id);
              return (
                <div key={player.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium min-w-[120px]">{player.name}</span>
                    <Input
                      className="flex-1"
                      placeholder={t('event.playerFeedback.placeholder')}
                      value={notes[player.id] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [player.id]: e.target.value }))}
                      disabled={saving[player.id]}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(player.id);
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(player.id)}
                      disabled={saving[player.id] || !notes[player.id]?.trim()}
                    >
                      {saved[player.id] ? (
                        <Check className="h-4 w-4" />
                      ) : saving[player.id] ? (
                        t('common.messages.saving')
                      ) : (
                        t('common.buttons.save')
                      )}
                    </Button>
                  </div>
                  {existing.length > 0 && (
                    <div className="ml-[128px] space-y-1">
                      {existing.map((fb) => (
                        <p key={fb.id} className="text-xs text-muted-foreground">
                          {fb.author.full_name}: {fb.content}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      )}
    </Card>
  );
}
