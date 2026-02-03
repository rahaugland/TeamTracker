import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Users, Calendar, FileCheck } from 'lucide-react';
import type { ImportResult } from '@/services/import.service';

interface ImportProgressProps {
  result: ImportResult;
  isImporting: boolean;
}

export function ImportProgress({ result, isImporting }: ImportProgressProps) {
  const { t } = useTranslation();

  const progressPercentage = result.total > 0 ? (result.processed / result.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isImporting && <Loader2 className="w-5 h-5 animate-spin" />}
            {t('import.importProgress')}
          </CardTitle>
          <CardDescription>
            {isImporting
              ? t('import.importingData')
              : result.completed
              ? t('import.importCompleted')
              : t('import.preparingImport')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t('import.processed', {
                  processed: result.processed,
                  total: result.total,
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-lg font-bold text-emerald-400">{result.successful}</div>
                <div className="text-xs text-emerald-400/80">{t('import.successful')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-club-primary/10 border border-club-primary/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-club-primary" />
              <div>
                <div className="text-lg font-bold text-club-primary">{result.failed}</div>
                <div className="text-xs text-club-primary/80">{t('import.failed')}</div>
              </div>
            </div>
          </div>

          {result.completed && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">{t('import.importSummary')}</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">{result.playersCreated}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('import.playersCreated')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">{result.eventsCreated}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('import.eventsCreated')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">{result.attendanceRecordsCreated}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('import.attendanceRecords')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">{t('import.importErrors')}</div>
                <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-muted-foreground">
                      {t('import.moreErrors', { count: result.errors.length - 10 })}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {result.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">{t('import.importWarnings')}</div>
                <ul className="list-disc list-inside space-y-1 text-sm max-h-32 overflow-y-auto">
                  {result.warnings.slice(0, 5).map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                  {result.warnings.length > 5 && (
                    <li className="text-muted-foreground">
                      {t('import.moreWarnings', { count: result.warnings.length - 5 })}
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result.completed && result.failed === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-400">
            {t('import.importSuccessMessage', { count: result.successful })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
