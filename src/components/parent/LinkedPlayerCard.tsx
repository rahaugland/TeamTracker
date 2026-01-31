import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LinkedPlayerWithDetails } from '@/services/parent-links.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';

interface LinkedPlayerCardProps {
  player: LinkedPlayerWithDetails;
  onViewSchedule?: (playerId: string) => void;
}

/**
 * Linked player card component
 * Displays a linked player's information for parents
 */
export function LinkedPlayerCard({ player, onViewSchedule }: LinkedPlayerCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const activeTeams = player.team_memberships?.filter((tm) => tm.team) || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={player.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{player.name}</CardTitle>
              {player.email && (
                <p className="text-sm text-muted-foreground">{player.email}</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Teams */}
        {activeTeams.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('team.plural')}</span>
            </div>
            <div className="space-y-2">
              {activeTeams.map((tm) => (
                <div
                  key={tm.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <span className="text-sm">{tm.team.name}</span>
                  {tm.jersey_number && (
                    <Badge variant="outline">#{tm.jersey_number}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positions */}
        {player.positions && player.positions.length > 0 && (
          <div className="mb-4">
            <span className="text-sm font-medium mb-2 block">{t('player.position')}</span>
            <div className="flex flex-wrap gap-2">
              {player.positions.map((position) => (
                <Badge key={position} variant="secondary">
                  {t(`player.positions.${position}`)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onViewSchedule && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewSchedule(player.id)}
              className="flex-1"
            >
              {t('navigation.schedule')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/players/${player.id}`)}
            className="flex-1"
          >
            {t('player.viewProfile')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
