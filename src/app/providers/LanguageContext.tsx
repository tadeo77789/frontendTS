import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'es' | 'en' | 'fr' | 'pt';

const VALID_CODES: readonly LanguageCode[] = ['es', 'en', 'fr', 'pt'];

/** Cada idioma con su propio nombre (autonimo): se reconoce sin depender del idioma activo. */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português',
};

export const LANGUAGE_LABELS = Object.values(LANGUAGE_NAMES);

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  applyLanguage: (lang: LanguageCode) => void;
  setPreferenceScope: (userId: number | null) => Promise<void>;
  localStorageError: string | null;
}

interface PreferenceScope {
  storageKey: string;
  revision: number;
}

const makeScope = (userId: number | null): PreferenceScope => ({
  storageKey: `@profile_language:${userId === null ? 'guest' : userId}`,
  revision: 0,
});

const isLanguageCode = (value: unknown): value is LanguageCode =>
  typeof value === 'string'
  && VALID_CODES.some(code => code === value);

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [language, setLang] = useState<LanguageCode>('es');
  const [localStorageError, setLocalStorageError] =
    useState<string | null>(null);

  const initialScopeRef = useRef<PreferenceScope>(makeScope(null));
  const scopeRef = useRef(initialScopeRef.current);
  const mountedRef = useRef(true);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const isCurrentScope = useCallback(
    (scope: PreferenceScope): boolean =>
      mountedRef.current && scopeRef.current === scope,
    [],
  );

  const hydrateScope = useCallback(async (
    scope: PreferenceScope,
  ): Promise<void> => {
    const revision = scope.revision;

    try {
      const stored = await AsyncStorage.getItem(scope.storageKey);

      if (
        !isCurrentScope(scope)
        || scope.revision !== revision
      ) {
        return;
      }

      if (isLanguageCode(stored)) {
        setLang(stored);
      }
    } catch {
      if (
        isCurrentScope(scope)
        && scope.revision === revision
      ) {
        setLocalStorageError('No se pudo cargar el idioma local');
      }
    }
  }, [isCurrentScope]);

  const setPreferenceScope = useCallback(async (
    userId: number | null,
  ): Promise<void> => {
    if (
      userId !== null
      && (!Number.isInteger(userId) || userId <= 0)
    ) {
      throw new Error('El identificador de usuario no es válido');
    }

    if (!mountedRef.current) return;

    // Una instancia nueva invalida operaciones anteriores,
    // incluso si se vuelve a seleccionar el mismo usuario.
    const scope = makeScope(userId);
    scopeRef.current = scope;

    setLang('es');
    setLocalStorageError(null);

    await hydrateScope(scope);
  }, [hydrateScope]);

  const applyLanguage = useCallback((
    lang: LanguageCode,
  ): void => {
    if (!isLanguageCode(lang)) {
      throw new Error('El idioma no es válido');
    }

    if (!mountedRef.current) return;

    // La aplicación explícita tiene prioridad sobre lecturas
    // y escrituras pendientes. No modifica AsyncStorage.
    scopeRef.current.revision += 1;
    setLang(lang);
  }, []);

  const setLanguage = useCallback(async (
    lang: LanguageCode,
  ): Promise<void> => {
    if (!isLanguageCode(lang)) {
      throw new Error('El idioma no es válido');
    }

    if (!mountedRef.current) return;

    const scope = scopeRef.current;
    const revision = ++scope.revision;

    const isCurrentOperation = (): boolean =>
      isCurrentScope(scope) && scope.revision === revision;

    setLocalStorageError(null);

    const operation = writeQueueRef.current.then(async () => {
      if (!isCurrentOperation()) return;

      try {
        await AsyncStorage.setItem(scope.storageKey, lang);
      } catch {
        if (isCurrentOperation()) {
          setLocalStorageError('No se pudo guardar el idioma local');
        }
        return;
      }

      if (!isCurrentOperation()) return;

      // Solo cambia el valor mostrado después de guardar.
      setLang(lang);
    });

    writeQueueRef.current = operation;
    await operation;
  }, [isCurrentScope]);

  useEffect(() => {
    mountedRef.current = true;

    // No restaura visitante si un hijo ya seleccionó otro ámbito.
    const initialScope = initialScopeRef.current;
    if (scopeRef.current === initialScope) {
      void hydrateScope(initialScope);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [hydrateScope]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    applyLanguage,
    setPreferenceScope,
    localStorageError,
  }), [
    language,
    setLanguage,
    applyLanguage,
    setPreferenceScope,
    localStorageError,
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return ctx;
};