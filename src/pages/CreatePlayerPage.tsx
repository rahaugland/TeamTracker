import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { createPlayer } from '@/services/players.service';
import { PlayerForm } from '@/components/forms/PlayerForm';
import type { PlayerFormDataNew } from '@/lib/validations/playerNew';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * CreatePlayerPage component
 * Handles creation of new players
 */
export function CreatePlayerPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PlayerFormDataNew) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const player = await createPlayer({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birth_date: data.birthDate || undefined,
        positions: data.positions,
        photo_url: data.photoUrl || undefined,
        created_by: user.id,
      });

      navigate(`/players/${player.id}`);
    } catch (err) {
      console.error('Error creating player:', err);
      setError(t('common.messages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/players');
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={handleCancel} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t('player.addPlayer')}</CardTitle>
          <CardDescription>
            {t('player.addPlayerDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          <PlayerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
