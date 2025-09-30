import { routing } from '@/i18n/routing';

/**
 * Detects the user's preferred locale based on browser settings
 */
export function detectLocale(acceptLanguage?: string): string {
  if (!acceptLanguage) {
    return routing.defaultLocale;
  }

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find the first supported locale
  for (const { code } of languages) {
    // Check exact match
    if (routing.locales.includes(code as any)) {
      return code;
    }
    
    // Check language prefix (e.g., 'zh' for 'zh-TW')
    const prefix = code.split('-')[0];
    const matchingLocale = routing.locales.find(locale => 
      locale.toLowerCase().startsWith(prefix)
    );
    
    if (matchingLocale) {
      return matchingLocale;
    }
  }

  return routing.defaultLocale;
}

/**
 * Formats numbers according to locale
 */
export function formatNumber(
  number: number, 
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Formats dates according to locale
 */
export function formatDate(
  date: Date, 
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Formats currency according to locale
 */
export function formatCurrency(
  amount: number, 
  locale: string,
  currency: string = 'HKD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Gets the display name for a locale
 */
export function getLocaleDisplayName(locale: string): string {
  const displayNames: Record<string, string> = {
    'en': 'English',
    'zh-TW': '繁體中文'
  };
  
  return displayNames[locale] || locale;
}

/**
 * Checks if a locale is RTL (Right-to-Left)
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale.split('-')[0]);
}