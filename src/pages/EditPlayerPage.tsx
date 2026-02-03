import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPlayer, updatePlayer } from '@/services/players.service';
import { PlayerForm } from '@/components/forms/PlayerForm';
import type { PlayerFormDataNew } from '@/lib/validations/playerNew';
import type { Player } from '@/types/database.types';

/**
 * EditPlayerPage component
 * Handles editing of existing players - VolleyQuest style
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/coach-dashboard" className="text-gray-400 hover:text-vq-teal transition-colors">
          Dashboard
        </Link>
        <span className="text-gray-500">/</span>
        <Link to="/players" className="text-gray-400 hover:text-vq-teal transition-colors">
          Players
        </Link>
        <span className="text-gray-500">/</span>
        <Link to={`/players/${id}`} className="text-gray-400 hover:text-vq-teal transition-colors">
          {player.name}
        </Link>
        <span className="text-gray-500">/</span>
        <span className="text-white">Edit</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-[32px] uppercase tracking-tight text-white mb-1">
          {t('player.editPlayer')}
        </h1>
        <p className="text-sm text-gray-400">
          {t('player.editPlayerDescription')}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-club-primary to-club-secondary" />
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
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
        </div>
      </div>
    </div>
  );
}
