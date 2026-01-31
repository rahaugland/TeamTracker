import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUI } from '@/store';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'no', name: 'Norsk' },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { language, setLanguage } = useUI();

  const handleLanguageChange = (languageCode: string) => {
    // Update both i18n and Zustand store (which persists to localStorage)
    i18n.changeLanguage(languageCode);
    setLanguage(languageCode);
  };

  // Use the persisted language from Zustand, fallback to i18n
  const currentLanguage = language || i18n.language;

  return (
    <div className="space-y-2">
      <Label htmlFor="language">{t('settings.language')}</Label>
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger id="language" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
