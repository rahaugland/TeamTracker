import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploader } from '@/components/import/FileUploader';
import { ColumnMapper } from '@/components/import/ColumnMapper';
import { ImportPreview } from '@/components/import/ImportPreview';
import { ImportProgress } from '@/components/import/ImportProgress';
import { useAuth } from '@/store';
import {
  parseCSV,
  parseXLSX,
  autoDetectColumns,
  validateImport,
  performImport,
  type ParseResult,
  type ColumnMapping,
  type ValidationResult,
  type ImportResult,
  type CSVRow,
} from '@/services/import.service';
import { supabase } from '@/lib/supabase';

type Step = 'upload' | 'map' | 'preview' | 'import' | 'complete';

interface Team {
  id: string;
  name: string;
  season_id: string;
}

export function ImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [createMissingPlayers, setCreateMissingPlayers] = useState(true);
  const [createMissingEvents, setCreateMissingEvents] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoadingTeams(true);
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, season_id')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
      if (data && data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);

    try {
      let result: ParseResult;

      if (file.name.endsWith('.xlsx')) {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        result = await parseXLSX(arrayBuffer);
      } else {
        // Parse CSV file
        const content = await file.text();
        result = await parseCSV(content);
      }

      if (result.error) {
        alert(`${t('import.parseError')}: ${result.error}`);
        return;
      }

      setParseResult(result);

      const detectedMapping = autoDetectColumns(result.columns);
      setColumnMapping(detectedMapping);

      setCurrentStep('map');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(t('import.parseError'));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParseResult(null);
    setColumnMapping({});
    setValidation(null);
    setCurrentStep('upload');
  };

  const handleMappingNext = () => {
    if (!parseResult) return;

    const validationResult = validateImport(parseResult.data, columnMapping);
    setValidation(validationResult);
    setCurrentStep('preview');
  };

  const handleStartImport = async () => {
    if (!parseResult || !validation || !validation.valid || !user?.id || !selectedTeamId) return;

    setCurrentStep('import');
    setIsImporting(true);

    try {
      const result = await performImport(
        parseResult.data,
        {
          teamId: selectedTeamId,
          columnMapping,
          createMissingPlayers,
          createMissingEvents,
          userId: user.id,
        },
        (progress: any) => {
          setImportResult(progress);
        }
      );

      setImportResult(result);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Import error:', error);
      alert(t('import.importError'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportAnother = () => {
    setSelectedFile(null);
    setParseResult(null);
    setColumnMapping({});
    setValidation(null);
    setImportResult(null);
    setCurrentStep('upload');
  };

  const stepNumber = {
    upload: 1,
    map: 2,
    preview: 3,
    import: 4,
    complete: 5,
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/schedule">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('import.title')}</h1>
            <p className="text-muted-foreground">{t('import.description')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        {(['upload', 'map', 'preview', 'import', 'complete'] as Step[]).map((step, idx) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  stepNumber[currentStep] > stepNumber[step]
                    ? 'bg-emerald-500 text-white'
                    : stepNumber[currentStep] === stepNumber[step]
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNumber[currentStep] > stepNumber[step] ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  idx + 1
                )}
              </div>
              <div className="text-xs mt-2 text-center">
                {t(`import.steps.${step}`)}
              </div>
            </div>
            {idx < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  stepNumber[currentStep] > stepNumber[step]
                    ? 'bg-emerald-500'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {currentStep === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('import.selectTeam')}</CardTitle>
              <CardDescription>{t('import.selectTeamDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Label>{t('team.singular')}</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('team.selectTeam')} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <FileUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClear={handleClearFile}
          />

          <Card>
            <CardHeader>
              <CardTitle>{t('import.aboutSpond')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{t('import.spondDescription')}</p>
              <div>
                <h4 className="font-medium mb-2">{t('import.howToExport')}</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>{t('import.exportStep1')}</li>
                  <li>{t('import.exportStep2')}</li>
                  <li>{t('import.exportStep3')}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'map' && parseResult && (
        <div>
          <ColumnMapper
            columns={parseResult.columns}
            data={parseResult.data}
            mapping={columnMapping}
            onMappingChange={setColumnMapping}
          />

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleClearFile}>
              {t('common.buttons.back')}
            </Button>
            <Button onClick={handleMappingNext}>{t('common.buttons.next')}</Button>
          </div>
        </div>
      )}

      {currentStep === 'preview' && validation && (
        <div>
          <ImportPreview
            validation={validation}
            createMissingPlayers={createMissingPlayers}
            createMissingEvents={createMissingEvents}
            onCreateMissingPlayersChange={setCreateMissingPlayers}
            onCreateMissingEventsChange={setCreateMissingEvents}
          />

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep('map')}>
              {t('common.buttons.back')}
            </Button>
            <Button onClick={handleStartImport} disabled={!validation.valid}>
              {t('import.startImport')}
            </Button>
          </div>
        </div>
      )}

      {(currentStep === 'import' || currentStep === 'complete') && importResult && (
        <div>
          <ImportProgress result={importResult} isImporting={isImporting} />

          {currentStep === 'complete' && (
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleImportAnother}>
                {t('import.importAnother')}
              </Button>
              <Button asChild>
                <Link to="/schedule">{t('import.viewSchedule')}</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
