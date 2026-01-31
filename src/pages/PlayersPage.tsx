import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePlayers } from '@/store';
import { getPlayers, deletePlayer } from '@/services/players.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { POSITION_NAMES } from '@/types/database.types';

/**
 * PlayersPage component
 * Lists all players with search functionality
 */
export function PlayersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players, setPlayers } = usePlayers();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; playerId: string | null }>({
    open: false,
    playerId: null,
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!deleteConfirm.playerId) return;

    try {
      await deletePlayer(deleteConfirm.playerId);
      setPlayers(players.filter((p) => p.id !== deleteConfirm.playerId));
      setDeleteConfirm({ open: false, playerId: null });
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="gradient-accent px-4 py-12 mb-8 shadow-lg">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">{t('navigation.players')}</h1>
          <Button onClick={() => navigate('/players/new')} size="lg" className="shadow-xl">
            {t('player.addPlayer')}
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 pb-8">

      {players.length > 0 && (
        <div className="mb-6">
          <Input
            placeholder={t('player.searchPlayers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      )}

      {filteredPlayers.length === 0 ? (
        <EmptyState
          title={players.length === 0 ? t('player.noPlayers') : t('player.search.noResults')}
          description={players.length === 0 ? t('player.noPlayersDescription') : t('player.search.tryDifferentQuery')}
          action={
            players.length === 0
              ? {
                  label: t('player.addPlayer'),
                  onClick: () => navigate('/players/new'),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player, index) => (
            <Card
              key={player.id}
              className={`hover-glow border-l-4 ${
                index % 3 === 0
                  ? 'border-l-primary card-gradient-orange'
                  : index % 3 === 1
                  ? 'border-l-secondary card-gradient-blue'
                  : 'border-l-accent card-gradient-teal'
              }`}
            >
              <CardHeader>
                <CardTitle className={
                  index % 3 === 0
                    ? 'text-primary'
                    : index % 3 === 1
                    ? 'text-secondary'
                    : 'text-accent'
                }>{player.name}</CardTitle>
                <CardDescription className="font-medium">
                  {player.positions.map((pos) => POSITION_NAMES[pos]).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {player.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{player.email}</span>
                    </div>
                  )}
                  {player.birth_date && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(player.birth_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    {t('player.viewProfile')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, playerId: player.id })}
                  >
                    {t('common.buttons.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, playerId: null })}
        title={t('player.deletePlayer')}
        description={t('player.deleteConfirm')}
        onConfirm={handleDeletePlayer}
        variant="destructive"
      />
    </div>
  );
}
