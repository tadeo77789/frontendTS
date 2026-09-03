import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'es' | 'en' | 'fr' | 'pt';

const STORAGE_KEY = '@app_language';
const VALID_CODES: LanguageCode[] = ['es', 'en', 'fr', 'pt'];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  es: 'Español',
  en: 'Inglés',
  fr: 'Francés',
  pt: 'Português',
};

export const LANGUAGE_LABELS = Object.values(LANGUAGE_NAMES);

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<LanguageCode>('es');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored && (VALID_CODES as string[]).includes(stored)) {
        setLang(stored as LanguageCode);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setLang(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  return ctx;
};
