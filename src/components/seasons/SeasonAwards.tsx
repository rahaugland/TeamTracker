import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeasonAward, SeasonAwardType } from '@/types/database.types';

interface SeasonAwardsProps {
  awards: SeasonAward[];
  playerNames: Record<string, string>;
}

const AWARD_ORDER: SeasonAwardType[] = [
  'season_mvp', 'most_improved', 'best_attendance',
  'top_attacker', 'top_server', 'top_defender', 'top_passer', 'most_practices',
];

const AWARD_ICONS: Record<SeasonAwardType, string> = {
  season_mvp: '🏆',
  most_improved: '📈',
  best_attendance: '✅',
  top_attacker: '⚡',
  top_server: '🎯',
  top_defender: '🛡️',
  top_passer: '🏐',
  most_practices: '💪',
};

export function SeasonAwardsDisplay({ awards, playerNames }: SeasonAwardsProps) {
  const { t } = useTranslation();

  if (awards.length === 0) return null;

  const sorted = [...awards].sort(
    (a, b) => AWARD_ORDER.indexOf(a.award_type as SeasonAwardType) - AWARD_ORDER.indexOf(b.award_type as SeasonAwardType)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('awards.seasonAwards')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((award) => (
            <div
              key={award.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                {AWARD_ICONS[award.award_type as SeasonAwardType] || '🏅'}
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
                    {formatAwardValue(award.award_type as SeasonAwardType, award.award_value)}
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

function formatAwardValue(type: SeasonAwardType, value: number): string {
  switch (type) {
    case 'best_attendance':
    case 'top_attacker':
    case 'top_server':
      return `${value}%`;
    case 'top_passer':
    case 'top_defender':
      return String(value);
    case 'most_practices':
      return `${value} practices`;
    default:
      return String(value);
  }
}
