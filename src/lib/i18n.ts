import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

// Get language from localStorage or default to 'es'
// This will be updated when user info is loaded from the API
const getStoredLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('alenna-language');
    if (stored && (stored === 'es' || stored === 'en')) {
      return stored;
    }
  }
  return 'es'; // Default to Spanish
};

// Function to update language from user info (called from UserContext)
export const updateLanguageFromUser = (language?: string) => {
  if (language && (language === 'es' || language === 'en')) {
    i18n.changeLanguage(language);
    if (typeof window !== 'undefined') {
      localStorage.setItem('alenna-language', language);
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: esTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Listen for language changes and update localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('alenna-language', lng);
  }
});

export default i18n;

