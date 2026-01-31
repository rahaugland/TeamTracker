import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameAward, GameAwardType } from '@/types/database.types';

interface MatchAwardsProps {
  awards: GameAward[];
  playerNames: Record<string, string>;
}

const AWARD_ORDER: GameAwardType[] = ['mvp', 'top_attacker', 'top_server', 'top_defender', 'top_passer'];

export function MatchAwards({ awards, playerNames }: MatchAwardsProps) {
  const { t } = useTranslation();

  if (awards.length === 0) return null;

  const sorted = [...awards].sort(
    (a, b) => AWARD_ORDER.indexOf(a.award_type as GameAwardType) - AWARD_ORDER.indexOf(b.award_type as GameAwardType)
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('awards.matchAwards')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((award) => (
            <div
              key={award.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                {award.award_type === 'mvp' && '⭐'}
                {award.award_type === 'top_attacker' && '⚡'}
                {award.award_type === 'top_server' && '🎯'}
                {award.award_type === 'top_defender' && '🛡️'}
                {award.award_type === 'top_passer' && '🏐'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {t(`awards.types.${award.award_type}`)}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {playerNames[award.player_id] || 'Unknown'}
                </p>
                {award.award_value != null && (
                  <p className="text-xs text-muted-foreground">
                    {award.award_type === 'top_attacker'
                      ? `${award.award_value}%`
                      : award.award_type === 'top_passer'
                      ? `${award.award_value} rating`
                      : String(award.award_value)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
