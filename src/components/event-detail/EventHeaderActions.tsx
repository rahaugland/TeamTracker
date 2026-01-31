import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface EventHeaderActionsProps {
  eventId: string;
  eventTitle: string;
  eventType: string;
  opponent?: string | null;
  isFinalized: boolean;
  isCoach: boolean;
  hasStats: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onFinalize: () => void;
}

export function EventHeaderActions({
  eventId,
  eventTitle,
  eventType,
  opponent,
  isFinalized,
  isCoach,
  hasStats,
  onEdit,
  onDelete,
  onFinalize,
}: EventHeaderActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <Button variant="outline" onClick={() => navigate('/schedule')} className="mb-4">
        {t('common.buttons.back')}
      </Button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{eventTitle}</h1>
          <p className="text-muted-foreground">
            {t(`event.types.${eventType}` as any)}
            {opponent && ` vs ${opponent}`}
          </p>
        </div>
        <div className="flex gap-2">
          {(eventType === 'game' || eventType === 'tournament') && isCoach && !isFinalized && (
            <Button onClick={() => navigate(`/events/${eventId}/stats`)}>
              {t('stats.recordStats')}
            </Button>
          )}
          {(eventType === 'game' || eventType === 'tournament') && isCoach && !isFinalized && hasStats && (
            <Button variant="outline" onClick={onFinalize}>
              {t('awards.finalizeGame')}
            </Button>
          )}
          {isFinalized && (
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
              {t('awards.finalized')}
            </span>
          )}
          {isCoach && !isFinalized && (
            <>
              <Button variant="outline" onClick={onEdit}>
                {t('common.buttons.edit')}
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                {t('common.buttons.delete')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
