'use client';

import { useLocale as useNextIntlLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { getLocaleDisplayName } from '@/lib/utils/locale';
import { useUIState } from './useAppState';

export function useLocale() {
  const locale = useNextIntlLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { actions: { setLanguage } } = useUIState();

  const switchLocale = (newLocale: string) => {
    if (routing.locales.includes(newLocale as any)) {
      // Update global state
      setLanguage(newLocale as 'en' | 'zh-TW');
      // Navigate to new locale
      router.replace(pathname, { locale: newLocale });
    }
  };

  const getAvailableLocales = () => {
    return routing.locales.map(loc => ({
      code: loc,
      name: getLocaleDisplayName(loc),
      isActive: loc === locale
    }));
  };

  const getOtherLocale = () => {
    return routing.locales.find(loc => loc !== locale) || routing.defaultLocale;
  };

  return {
    locale,
    switchLocale,
    getAvailableLocales,
    getOtherLocale,
    isDefaultLocale: locale === routing.defaultLocale
  };
}