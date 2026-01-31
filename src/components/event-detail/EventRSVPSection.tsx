import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <Card className="mb-6">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('rsvp.title')}</CardTitle>
            <CardDescription>
              {rsvpSummary.attending} {t('rsvp.status.attending')}, {rsvpSummary.not_attending} {t('rsvp.status.not_attending')}, {rsvpSummary.maybe} {t('rsvp.status.maybe')}, {rsvpSummary.pending} {t('rsvp.status.pending')}
            </CardDescription>
          </div>
          <span className="text-muted-foreground text-sm">{collapsed ? '▸' : '▾'}</span>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <div className="space-y-3">
            {teamPlayers.map((player) => {
              const playerRsvp = getRSVPStatus(player.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{player.name}</p>
                  </div>
                  {isCoach ? (
                    <Select
                      value={playerRsvp}
                      onValueChange={(value) =>
                        onRSVPChange(player.id, value as RsvpStatus)
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={t('rsvp.setRSVP')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('rsvp.status.pending')}</SelectItem>
                        <SelectItem value="attending">{t('rsvp.status.attending')}</SelectItem>
                        <SelectItem value="not_attending">{t('rsvp.status.not_attending')}</SelectItem>
                        <SelectItem value="maybe">{t('rsvp.status.maybe')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t(`rsvp.status.${playerRsvp}`)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
