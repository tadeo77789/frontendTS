import { useLanguage, type LanguageCode } from '../../providers/LanguageContext';
import es from './locales/es';
import en from './locales/en';
import fr from './locales/fr';
import pt from './locales/pt';

export type TranslationKey = keyof typeof es;

const translations: Record<LanguageCode, typeof es> = { es, en, fr, pt };

export const useTranslation = () => {
  const { language } = useLanguage();
  const t = (key: TranslationKey): string => {
    const dict = translations[language] as Record<string, string>;
    return dict[key] ?? (es as Record<string, string>)[key] ?? key;
  };
  return { t, language };
};
