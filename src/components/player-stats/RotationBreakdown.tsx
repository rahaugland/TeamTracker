import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RotationStats } from '@/services/player-stats.service';
import { useTranslation } from 'react-i18next';

interface RotationBreakdownProps {
  rotationStats: RotationStats[];
}

/**
 * 6-rotation grid showing kill%, pass rating, digs per rotation.
 * Only renders if rotation data exists.
 */
export function RotationBreakdown({ rotationStats }: RotationBreakdownProps) {
  const { t } = useTranslation();

  if (rotationStats.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('stats.rotationBreakdown.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rotationStats.map((rs) => (
            <div
              key={rs.rotation}
              className={`rounded-lg border p-3 ${
                rs.isBelowAverage ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">
                  {t('stats.rotationBreakdown.rotation')} {rs.rotation}
                </span>
                <span className="text-xs text-muted-foreground">
                  {rs.gamesInRotation} {t('stats.rotationBreakdown.entries')}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('stats.rotationBreakdown.killPct')}</span>
                  <span className="font-medium">{(rs.killPercentage * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('stats.rotationBreakdown.passRating')}</span>
                  <span className="font-medium">{rs.passRating.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('stats.rotationBreakdown.digs')}</span>
                  <span className="font-medium">{rs.digs}</span>
                </div>
              </div>
              {rs.isBelowAverage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {t('stats.rotationBreakdown.belowAverage')}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
