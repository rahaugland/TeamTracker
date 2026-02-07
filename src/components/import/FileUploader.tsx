import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, File, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function FileUploader({ onFileSelect, selectedFile, onClear }: FileUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const validFile = files.find((file) =>
        file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
      );

      if (validFile) {
        onFileSelect(validFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear file">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">
            {t('import.uploadFile')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('import.dragDropOrClick')}
          </p>
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                {t('import.browseFiles')}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileInput}
          />
          <p className="text-xs text-muted-foreground mt-4">
            {t('import.csvOrExcel')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
