import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPlayer, updatePlayer } from '@/services/players.service';
import { PlayerForm } from '@/components/forms/PlayerForm';
import type { PlayerFormDataNew } from '@/lib/validations/playerNew';
import type { Player } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * EditPlayerPage component
 * Handles editing of existing players
 */
export function EditPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPlayer(id);
    }
  }, [id]);

  const loadPlayer = async (playerId: string) => {
    setIsLoading(true);
    try {
      const data = await getPlayer(playerId);
      setPlayer(data);
    } catch (err) {
      console.error('Error loading player:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: PlayerFormDataNew) => {
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updatePlayer(id, {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birth_date: data.birthDate || undefined,
        positions: data.positions,
        photo_url: data.photoUrl || undefined,
      });

      navigate(`/players/${id}`);
    } catch (err) {
      console.error('Error updating player:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/players/${id}` : '/players');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={handleCancel} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t('player.editPlayer')}</CardTitle>
          <CardDescription>
            {t('player.editPlayerDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <PlayerForm
            defaultValues={{
              name: player.name,
              email: player.email || '',
              phone: player.phone || '',
              birthDate: player.birth_date || '',
              positions: player.positions,
              photoUrl: player.photo_url || '',
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
