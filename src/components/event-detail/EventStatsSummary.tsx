import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateTeamTotals } from '@/utils/event-helpers';
import type { StatEntry } from '@/types/database.types';

interface EventStatsSummaryProps {
  statEntries: StatEntry[];
}

export function EventStatsSummary({ statEntries }: EventStatsSummaryProps) {
  const { t } = useTranslation();

  if (statEntries.length === 0) {
    return null;
  }

  const totals = calculateTeamTotals(statEntries);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('stats.teamTotals')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-2xl font-bold">{totals.kills}</p>
            <p className="text-xs text-muted-foreground">
              {t('stats.fields.kills')}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-2xl font-bold">{totals.aces}</p>
            <p className="text-xs text-muted-foreground">
              {t('stats.fields.aces')}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-2xl font-bold">{totals.digs}</p>
            <p className="text-xs text-muted-foreground">
              {t('stats.fields.digs')}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <p className="text-2xl font-bold">
              {(totals.block_solos + totals.block_assists * 0.5).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('stats.fields.blockSolos')} + {t('stats.fields.blockAssists')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
