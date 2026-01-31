import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import type { PlayerWithMemberships } from '@/services/players.service';

interface FinalizedParticipantsCardProps {
  attendance: AttendanceRecordWithPlayer[];
  teamPlayers: PlayerWithMemberships[];
}

export function FinalizedParticipantsCard({
  attendance,
  teamPlayers,
}: FinalizedParticipantsCardProps) {
  const { t } = useTranslation();

  const participants = attendance.filter(
    (a) => a.status === 'present' || a.status === 'late'
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('awards.participants')}</CardTitle>
        <CardDescription>
          {participants.length} {t('player.plural').toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {participants.map((record) => {
            const player = teamPlayers.find((p) => p.id === record.player_id);
            return (
              <span
                key={record.id}
                className="px-3 py-1.5 text-sm rounded-full bg-muted border"
              >
                {player?.name || record.player_id}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
