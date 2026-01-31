import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import noTranslation from './locales/no/translation.json';

export const defaultNS = 'translation';
export const resources = {
  en: {
    translation: enTranslation,
  },
  no: {
    translation: noTranslation,
  },
} as const;

/**
 * Get the persisted language from Zustand localStorage
 * Falls back to 'en' if not found or invalid
 */
function getPersistedLanguage(): string {
  try {
    const stored = localStorage.getItem('teamtracker-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      const language = parsed?.state?.language;
      if (language && (language === 'en' || language === 'no')) {
        return language;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    lng: getPersistedLanguage(),
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS,
    resources,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
