import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Users, Calendar, FileText } from 'lucide-react';
import type { ValidationResult } from '@/services/import.service';
import { Label } from '@/components/ui/label';

interface ImportPreviewProps {
  validation: ValidationResult;
  createMissingPlayers: boolean;
  createMissingEvents: boolean;
  onCreateMissingPlayersChange: (value: boolean) => void;
  onCreateMissingEventsChange: (value: boolean) => void;
}

export function ImportPreview({
  validation,
  createMissingPlayers,
  createMissingEvents,
  onCreateMissingPlayersChange,
  onCreateMissingEventsChange,
}: ImportPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">{t('import.validationErrors')}</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">{t('import.validationWarnings')}</div>
            <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
              {validation.warnings.slice(0, 10).map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
              {validation.warnings.length > 10 && (
                <li className="text-muted-foreground">
                  {t('import.moreWarnings', { count: validation.warnings.length - 10 })}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('import.importSummary')}</CardTitle>
          <CardDescription>{t('import.importSummaryDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-2xl font-bold">{validation.stats.totalRows}</div>
                <div className="text-sm text-muted-foreground">{t('import.totalRecords')}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-2xl font-bold">{validation.stats.uniquePlayers.size}</div>
                <div className="text-sm text-muted-foreground">{t('import.uniquePlayers')}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-2xl font-bold">{validation.stats.uniqueDates.size}</div>
                <div className="text-sm text-muted-foreground">{t('import.uniqueEvents')}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">{t('import.attendanceBreakdown')}</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(validation.stats.statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-sm">
                  {t(`attendance.status.${status}` as any)}: {count}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">{t('import.importOptions')}</h4>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-players"
                checked={createMissingPlayers}
                onChange={(e) => onCreateMissingPlayersChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="create-players" className="cursor-pointer">
                {t('import.createMissingPlayers')}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {t('import.createMissingPlayersDescription')}
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-events"
                checked={createMissingEvents}
                onChange={(e) => onCreateMissingEventsChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="create-events" className="cursor-pointer">
                {t('import.createMissingEvents')}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {t('import.createMissingEventsDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      {validation.valid && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {t('import.readyToImport')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
