import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ExportFormat } from '@/services/export.service';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled }: ExportButtonProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          {t('reports.export.title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('csv')}>
          {t('reports.export.csv')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')}>
          {t('reports.export.excel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          {t('reports.export.pdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
