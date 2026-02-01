import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RsvpStatus } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { RSVPSummary } from '@/utils/event-helpers';

interface EventRSVPSectionProps {
  teamPlayers: PlayerWithMemberships[];
  rsvpSummary: RSVPSummary;
  isCoach: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  getRSVPStatus: (playerId: string) => RsvpStatus;
  onRSVPChange: (playerId: string, status: RsvpStatus) => void;
}

const STATUS_CONFIG: { key: RsvpStatus; color: string; bgColor: string; activeColor: string }[] = [
  { key: 'attending', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30', activeColor: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700' },
  { key: 'not_attending', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30', activeColor: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700' },
  { key: 'maybe', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/30', activeColor: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700' },
  { key: 'pending', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/50', activeColor: 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-600' },
];

export function EventRSVPSection({
  teamPlayers,
  rsvpSummary,
  isCoach,
  collapsed,
  onToggleCollapse,
  getRSVPStatus,
  onRSVPChange,
}: EventRSVPSectionProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<RsvpStatus>('attending');

  const playersByStatus = useMemo(() => {
    const grouped: Record<RsvpStatus, PlayerWithMemberships[]> = {
      attending: [],
      not_attending: [],
      maybe: [],
      pending: [],
    };
    for (const player of teamPlayers) {
      const status = getRSVPStatus(player.id);
      if (grouped[status]) {
        grouped[status].push(player);
      } else {
        grouped.pending.push(player);
      }
    }
    return grouped;
  }, [teamPlayers, getRSVPStatus]);

  const getCount = (status: RsvpStatus) => rsvpSummary[status] ?? 0;
  const total = teamPlayers.length;

  return (
    <Card className="mb-6">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('rsvp.title')}</CardTitle>
          <div className="flex items-center gap-3">
            {/* Summary badges — always visible */}
            <div className="flex items-center gap-1.5">
              {STATUS_CONFIG.map(({ key, color, bgColor }) => {
                const count = getCount(key);
                if (count === 0) return null;
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color} ${bgColor}`}
                  >
                    {count}
                  </span>
                );
              })}
              <span className="text-xs text-muted-foreground ml-1">/ {total}</span>
            </div>
            <span className="text-muted-foreground text-sm">{collapsed ? '▸' : '▾'}</span>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          {/* Status tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto">
            {STATUS_CONFIG.map(({ key, color, bgColor, activeColor }) => {
              const count = getCount(key);
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                    isActive
                      ? activeColor
                      : 'border-transparent hover:bg-muted/50'
                  }`}
                >
                  <span className={isActive ? color : 'text-muted-foreground'}>
                    {t(`rsvp.status.${key}`)}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-xs font-semibold ${
                      isActive ? `${color} ${bgColor}` : 'text-muted-foreground bg-muted/50'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Player list for active tab */}
          <div className="space-y-1">
            {playersByStatus[activeTab].length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('rsvp.noPlayersInStatus')}
              </p>
            ) : (
              playersByStatus[activeTab].map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30"
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  {isCoach && (
                    <Select
                      value={getRSVPStatus(player.id)}
                      onValueChange={(value) =>
                        onRSVPChange(player.id, value as RsvpStatus)
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attending">{t('rsvp.status.attending')}</SelectItem>
                        <SelectItem value="not_attending">{t('rsvp.status.not_attending')}</SelectItem>
                        <SelectItem value="maybe">{t('rsvp.status.maybe')}</SelectItem>
                        <SelectItem value="pending">{t('rsvp.status.pending')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
