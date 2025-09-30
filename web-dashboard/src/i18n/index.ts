import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import zhHKTranslations from './locales/zh-HK.json';
import zhCNTranslations from './locales/zh-CN.json';
import jaTranslations from './locales/ja.json';
import koTranslations from './locales/ko.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslations
  },
  'zh-HK': {
    translation: zhHKTranslations
  },
  'zh-CN': {
    translation: zhCNTranslations
  },
  ja: {
    translation: jaTranslations
  },
  ko: {
    translation: koTranslations
  },
  es: {
    translation: esTranslations
  },
  fr: {
    translation: frTranslations
  },
  de: {
    translation: deTranslations
  },
  ar: {
    translation: arTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // Support for number and date formatting
    react: {
      useSuspense: false,
    }
  });

export default i18n;