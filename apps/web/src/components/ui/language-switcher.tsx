'use client';

import * as React from "react"
import { useTranslations } from 'next-intl';
import { Button } from './button';
import { locales, type Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

const LanguageSwitcher = React.forwardRef<HTMLDivElement, LanguageSwitcherProps>(
  ({ currentLocale, onLocaleChange }, ref) => {
    const t = useTranslations('language');
    const [isOpen, setIsOpen] = React.useState(false);

    const languageNames: Record<Locale, string> = {
      en: t('english'),
      de: t('german')
    };

    const handleLocaleChange = (locale: Locale) => {
      onLocaleChange(locale);
      setIsOpen(false);
      
      // Set cookie
      document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Reload page to apply new locale
      window.location.reload();
    };

    return (
      <div ref={ref} className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {languageNames[currentLocale]}
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="py-1">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                    currentLocale === locale ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {languageNames[locale]}
                </button>
              ))}
            </div>
          </div>
        )}

        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }
);

LanguageSwitcher.displayName = "LanguageSwitcher";

export { LanguageSwitcher };