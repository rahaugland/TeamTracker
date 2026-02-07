import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { GameStatLine } from '@/services/player-stats.service';

interface GameLogCardsProps {
  games: GameStatLine[];
}

export function GameLogCards({ games }: GameLogCardsProps) {
  const { t } = useTranslation();

  if (games.length === 0) {
    return (
      <p className="text-sm text-white/50 text-center py-6">
        {t('player.stats.noData')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const killPct = game.attack_attempts > 0
          ? Math.round((game.kills / game.attack_attempts) * 100)
          : null;

        return (
          <div
            key={game.event.id}
            className="bg-navy-90 border border-white/[0.04] rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {game.event.opponent || game.event.title}
                </span>
              </div>
              <span className="text-xs text-white/50">
                {format(new Date(game.event.start_time), 'MMM d')}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <StatChip label={t('player.stats.gameLog.kills')} value={game.kills} />
              <StatChip label={t('player.stats.gameLog.aces')} value={game.aces} />
              <StatChip label={t('player.stats.gameLog.digs')} value={game.digs} />
              <StatChip
                label={t('player.stats.gameLog.killPct')}
                value={killPct !== null ? `${killPct}%` : '-'}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-white/50 font-medium">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}
