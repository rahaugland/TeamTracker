import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/utils/event-helpers';

interface EventInfoCardProps {
  startTime: string;
  endTime: string;
  location?: string | null;
  eventType: string;
  opponentTier?: number | null;
  notes?: string | null;
}

export function EventInfoCard({
  startTime,
  endTime,
  location,
  eventType,
  opponentTier,
  notes,
}: EventInfoCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('event.details')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <span className="text-sm font-medium">{t('event.startTime')}:</span>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(startTime)}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium">{t('event.endTime')}:</span>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(endTime)}
          </p>
        </div>
        {location && (
          <div>
            <span className="text-sm font-medium">{t('common.labels.location')}:</span>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{location}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View on Map
              </a>
            </div>
          </div>
        )}
        {(eventType === 'game' || eventType === 'tournament') && opponentTier && (
          <div>
            <span className="text-sm font-medium">{t('event.opponentTier.label')}:</span>
            <p className="text-sm text-muted-foreground">
              {t(`event.opponentTier.tier${opponentTier}` as any)} ({opponentTier}/9)
            </p>
          </div>
        )}
        {notes && (
          <div>
            <span className="text-sm font-medium">{t('common.labels.notes')}:</span>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
