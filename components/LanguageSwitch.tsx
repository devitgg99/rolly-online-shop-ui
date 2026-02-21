'use client';

import { useLocale } from '@/context/LocaleContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5',
        className
      )}
      role="group"
      aria-label="Switch language"
    >
      <Button
        type="button"
        variant={locale === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        className="rounded-md px-2.5 py-1 text-xs font-medium h-8 min-w-[3rem]"
        onClick={() => setLocale('en')}
      >
        {t('lang_english')}
      </Button>
      <Button
        type="button"
        variant={locale === 'km' ? 'secondary' : 'ghost'}
        size="sm"
        className="rounded-md px-2.5 py-1 text-xs font-medium h-8 min-w-[3rem]"
        onClick={() => setLocale('km')}
      >
        {t('lang_khmer')}
      </Button>
    </div>
  );
}
