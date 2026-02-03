import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { createPlayer } from '@/services/players.service';
import { PlayerForm } from '@/components/forms/PlayerForm';
import type { PlayerFormDataNew } from '@/lib/validations/playerNew';

/**
 * CreatePlayerPage component
 * Handles creation of new players - VolleyQuest style
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
        <span className="text-white">Add Player</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-[32px] uppercase tracking-tight text-white mb-1">
          {t('player.addPlayer')}
        </h1>
        <p className="text-sm text-gray-400">
          {t('player.addPlayerDescription')}
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
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
