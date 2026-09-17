import { useLanguage, type LanguageCode } from '../../providers/LanguageContext';
import es from './locales/es';
import en from './locales/en';
import fr from './locales/fr';
import pt from './locales/pt';

export type TranslationKey = keyof typeof es;

const translations: Record<LanguageCode, typeof es> = { es, en, fr, pt };

export const useTranslation = () => {
  const { language } = useLanguage();
  // Los parametros son opcionales: las cadenas sin marcadores {x} se devuelven tal cual.
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[language] as Record<string, string>;
    const text = dict[key] ?? (es as Record<string, string>)[key] ?? key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
  };
  return { t, language };
};
