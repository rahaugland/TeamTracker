import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BestXI } from '@/services/team-stats.service';

interface BestXIFormationProps {
  bestXI: BestXI | null;
  isLoading?: boolean;
}

interface PlayerCardProps {
  player: BestXI[keyof BestXI];
  label: string;
}

/**
 * BestXIFormation component
 * Displays best starting lineup in a formation layout
 */
export function BestXIFormation({ bestXI, isLoading = false }: BestXIFormationProps) {
  const { t } = useTranslation();

  const PlayerCard = ({ player, label }: PlayerCardProps) => {
    if (!player) {
      return (
        <div className="flex flex-col items-center p-3 border-2 border-dashed rounded-lg bg-muted/20">
          <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl text-muted-foreground">?</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('team.dashboard.noPlayerForPosition')}
          </p>
        </div>
      );
    }

    return (
      <Link
        to={`/players/${player.playerId}`}
        className="flex flex-col items-center p-3 border-2 border-primary/20 rounded-lg bg-card hover:bg-accent transition-colors"
      >
        <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>

        {/* Player Photo */}
        <div className="relative">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.playerName}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold border-2 border-primary">
              {player.playerName.charAt(0)}
            </div>
          )}

          {/* Jersey Number */}
          {player.jerseyNumber && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {player.jerseyNumber}
            </div>
          )}
        </div>

        {/* Player Name */}
        <p className="font-medium text-sm mt-2 text-center">{player.playerName}</p>

        {/* Rating */}
        <Badge className="mt-1">{player.rating}</Badge>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.bestXI')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.dashboard.bestXI')}</CardTitle>
        <CardDescription>Based on player ratings and positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Front Row: OHs and OPP */}
          <div className="grid grid-cols-3 gap-4">
            <PlayerCard player={bestXI?.outsideHitter1 ?? null} label={t('team.dashboard.outsideHitter')} />
            <PlayerCard player={bestXI?.opposite ?? null} label={t('team.dashboard.opposite')} />
            <PlayerCard player={bestXI?.outsideHitter2 ?? null} label={t('team.dashboard.outsideHitter')} />
          </div>

          {/* Middle Row: MBs and Setter */}
          <div className="grid grid-cols-3 gap-4">
            <PlayerCard player={bestXI?.middleBlocker1 ?? null} label={t('team.dashboard.middleBlocker')} />
            <PlayerCard player={bestXI?.setter ?? null} label={t('team.dashboard.setter')} />
            <PlayerCard player={bestXI?.middleBlocker2 ?? null} label={t('team.dashboard.middleBlocker')} />
          </div>

          {/* Back Row: Libero */}
          <div className="flex justify-center">
            <div className="w-1/3">
              <PlayerCard player={bestXI?.libero ?? null} label={t('team.dashboard.libero')} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
