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
import type { ThemeMode } from '../../shared/types';
import {
  Colors,
  DarkColors,
  GreenColors,
  GreenDarkColors,
} from '../../shared/constants/colors';

export type ColorAccent = 'purple' | 'green';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colorAccent: ColorAccent;
  toggleTheme: () => void;
  resetTheme: () => void;
  setColorAccent: (accent: ColorAccent) => void;

  applyTheme: (mode: ThemeMode) => void;
  applyColorAccent: (accent: ColorAccent) => void;
  setPreferenceScope: (userId: number | null) => Promise<void>;
  localStorageError: string | null;
}

interface PreferenceScope {
  themeKey: string;
  accentKey: string;
  themeRevision: number;
  accentRevision: number;
}

const makeScope = (userId: number | null): PreferenceScope => {
  const suffix = userId === null ? 'guest' : String(userId);

  return {
    themeKey: `@profile_theme:${suffix}`,
    accentKey: `@profile_accent:${suffix}`,
    themeRevision: 0,
    accentRevision: 0,
  };
};

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark';

const isColorAccent = (value: unknown): value is ColorAccent =>
  value === 'purple' || value === 'green';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [colorAccent, setColorAccentState] =
    useState<ColorAccent>('purple');
  const [localStorageError, setLocalStorageError] =
    useState<string | null>(null);

  const initialScopeRef = useRef<PreferenceScope>(makeScope(null));
  const scopeRef = useRef(initialScopeRef.current);
  const mountedRef = useRef(true);

  // Valor mostrado y última intención del usuario son distintos mientras guarda.
  const displayedModeRef = useRef<ThemeMode>('light');
  const requestedModeRef = useRef<ThemeMode>('light');

  // Serializa escrituras para evitar que un guardado antiguo termine después.
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const isCurrentScope = useCallback(
    (scope: PreferenceScope): boolean =>
      mountedRef.current && scopeRef.current === scope,
    [],
  );

  const hydrateScope = useCallback(async (
    scope: PreferenceScope,
  ): Promise<void> => {
    const themeRevision = scope.themeRevision;
    const accentRevision = scope.accentRevision;

    const [themeResult, accentResult] = await Promise.allSettled([
      AsyncStorage.getItem(scope.themeKey),
      AsyncStorage.getItem(scope.accentKey),
    ]);

    if (!isCurrentScope(scope)) return;

    // Una acción posterior tiene prioridad sobre la hidratación.
    if (scope.themeRevision === themeRevision) {
      if (themeResult.status === 'fulfilled') {
        if (isThemeMode(themeResult.value)) {
          displayedModeRef.current = themeResult.value;
          requestedModeRef.current = themeResult.value;
          setMode(themeResult.value);
        }
      } else {
        setLocalStorageError('No se pudo cargar el tema local');
      }
    }

    if (scope.accentRevision === accentRevision) {
      if (accentResult.status === 'fulfilled') {
        if (isColorAccent(accentResult.value)) {
          setColorAccentState(accentResult.value);
        }
      } else {
        setLocalStorageError('No se pudo cargar el acento local');
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

    // Una instancia nueva invalida lecturas y guardados de la sesión anterior,
    // incluso cuando se vuelve a seleccionar el mismo usuario.
    const scope = makeScope(userId);
    scopeRef.current = scope;

    displayedModeRef.current = 'light';
    requestedModeRef.current = 'light';
    setMode('light');
    setColorAccentState('purple');
    setLocalStorageError(null);

    await hydrateScope(scope);
  }, [hydrateScope]);

  const applyTheme = useCallback((next: ThemeMode): void => {
    if (!mountedRef.current) return;

    scopeRef.current.themeRevision += 1;
    displayedModeRef.current = next;
    requestedModeRef.current = next;
    setMode(next);
  }, []);

  const applyColorAccent = useCallback((
    next: ColorAccent,
  ): void => {
    if (!mountedRef.current) return;

    scopeRef.current.accentRevision += 1;
    setColorAccentState(next);
  }, []);

  const persistLocal = useCallback((
    field: 'theme' | 'accent',
    value: ThemeMode | ColorAccent,
  ): void => {
    if (!mountedRef.current) return;

    const scope = scopeRef.current;
    const revision = field === 'theme'
      ? ++scope.themeRevision
      : ++scope.accentRevision;
    const key = field === 'theme'
      ? scope.themeKey
      : scope.accentKey;

    const isCurrentOperation = (): boolean =>
      isCurrentScope(scope)
      && (
        field === 'theme'
          ? scope.themeRevision === revision
          : scope.accentRevision === revision
      );

    setLocalStorageError(null);

    writeQueueRef.current = writeQueueRef.current
      .then(async () => {
        if (!isCurrentOperation()) return;

        await AsyncStorage.setItem(key, value);

        if (!isCurrentOperation()) return;

        if (field === 'theme') {
          const next = value as ThemeMode;
          displayedModeRef.current = next;
          requestedModeRef.current = next;
          setMode(next);
        } else {
          setColorAccentState(value as ColorAccent);
        }
      })
      .catch(() => {
        if (!isCurrentOperation()) return;

        if (field === 'theme') {
          requestedModeRef.current = displayedModeRef.current;
        }

        setLocalStorageError(
          field === 'theme'
            ? 'No se pudo guardar el tema local'
            : 'No se pudo guardar el acento local',
        );
      });
  }, [isCurrentScope]);

  const toggleTheme = useCallback((): void => {
    const next: ThemeMode =
      requestedModeRef.current === 'light' ? 'dark' : 'light';

    requestedModeRef.current = next;
    persistLocal('theme', next);
  }, [persistLocal]);

  const resetTheme = useCallback((): void => {
    applyTheme('light');
  }, [applyTheme]);

  const setColorAccent = useCallback((
    accent: ColorAccent,
  ): void => {
    persistLocal('accent', accent);
  }, [persistLocal]);

  useEffect(() => {
    mountedRef.current = true;

    // No vuelve a seleccionar visitante si un hijo ya cambió de usuario.
    const initialScope = initialScopeRef.current;
    if (scopeRef.current === initialScope) {
      void hydrateScope(initialScope);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [hydrateScope]);

  const value = useMemo<ThemeContextType>(() => ({
    mode,
    isDark: mode === 'dark',
    colorAccent,
    toggleTheme,
    resetTheme,
    setColorAccent,
    applyTheme,
    applyColorAccent,
    setPreferenceScope,
    localStorageError,
  }), [
    mode,
    colorAccent,
    toggleTheme,
    resetTheme,
    setColorAccent,
    applyTheme,
    applyColorAccent,
    setPreferenceScope,
    localStorageError,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
};

export const useColors = () => {
  const { isDark, colorAccent } = useTheme();

  if (colorAccent === 'green') {
    return isDark ? GreenDarkColors : GreenColors;
  }

  return isDark ? DarkColors : Colors;
};