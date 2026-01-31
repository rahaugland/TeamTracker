import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ColumnMapping, CSVRow } from '@/services/import.service';
import { Badge } from '@/components/ui/badge';

interface ColumnMapperProps {
  columns: string[];
  data: CSVRow[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({ columns, data, mapping, onMappingChange }: ColumnMapperProps) {
  const { t } = useTranslation();

  const previewRows = data.slice(0, 5);

  const updateMapping = (field: keyof ColumnMapping, value: string | undefined) => {
    onMappingChange({
      ...mapping,
      [field]: value === 'none' ? undefined : value,
    });
  };

  const mappingFields = [
    { key: 'playerName' as const, label: t('import.fields.playerName'), required: true },
    { key: 'email' as const, label: t('import.fields.email'), required: false },
    { key: 'date' as const, label: t('import.fields.date'), required: true },
    { key: 'eventTitle' as const, label: t('import.fields.eventTitle'), required: false },
    { key: 'eventType' as const, label: t('import.fields.eventType'), required: false },
    { key: 'status' as const, label: t('import.fields.status'), required: true },
    { key: 'location' as const, label: t('import.fields.location'), required: false },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('import.mapColumns')}</CardTitle>
          <CardDescription>{t('import.mapColumnsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mappingFields.map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <Label className="w-40 flex items-center gap-2">
                {field.label}
                {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
              </Label>
              <Select
                value={mapping[field.key] || 'none'}
                onValueChange={(value) => updateMapping(field.key, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('import.selectColumn')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('import.noMapping')}</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('import.dataPreview')}</CardTitle>
          <CardDescription>
            {t('import.dataPreviewDescription', { count: previewRows.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col} className="whitespace-nowrap">
                        {row[col] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
