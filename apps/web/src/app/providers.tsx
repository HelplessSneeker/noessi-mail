'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [messages, setMessages] = useState<any>(null);
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Detect browser language
    const getBrowserLanguage = (): string => {
      if (typeof window !== 'undefined') {
        const browserLang = navigator.language.split('-')[0]; // Get main language code
        return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
      }
      return 'en';
    };

    const currentLocale = getBrowserLanguage();
    setLocale(currentLocale);

    // Load messages
    import(`../../messages/${currentLocale}.json`)
      .then((msgs) => setMessages(msgs.default))
      .catch(() => import(`../../messages/en.json`).then((msgs) => setMessages(msgs.default)));
  }, []);

  if (!messages) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
