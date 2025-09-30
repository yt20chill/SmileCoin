'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '@/lib/hooks/useLocale';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const t = useTranslations('language');
  const { locale, switchLocale, getOtherLocale } = useLocale();

  const handleToggle = () => {
    const otherLocale = getOtherLocale();
    switchLocale(otherLocale);
  };

  const getDisplayText = () => {
    return locale === 'en' ? '中文' : 'English';
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2"
      aria-label={t('switchTo', { language: getDisplayText() })}
    >
      <Globe className="h-4 w-4" />
      {getDisplayText()}
    </Button>
  );
}