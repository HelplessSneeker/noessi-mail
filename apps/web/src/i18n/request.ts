import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';
 
export default getRequestConfig(async () => {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Parse browser language preference
  const getBrowserLanguage = (): string => {
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split('-');
      return code;
    });
    
    // Return first supported language or default to English
    return languages.find(lang => ['en', 'de'].includes(lang)) || 'en';
  };

  const locale = getBrowserLanguage();
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});