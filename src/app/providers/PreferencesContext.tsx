
import React, {
  createContext, useContext, useState, useRef,
  useCallback, useEffect, useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useTheme, type ColorAccent } from './ThemeContext';
import { useLanguage, type LanguageCode } from './LanguageContext';
import type { ThemeMode } from '../../shared/types';
import {
  preferencesService, parsePreferencesResponse,
  type ProfilePreferences, type PreferencesPatch, type PreferencesLanguage,
} from '../../feature/Profile/services/preferences.service';

type LocalLanguage = 'fr' | 'pt';
type OperationKind = 'load' | 'save' | 'local' | 'cache';
type ErrorKind = OperationKind | 'busy';

export interface PreferencesError {
  kind: ErrorKind;
  message: string;
}

interface PreferencesContextType {
  preferences: ProfilePreferences | null;
  loading: boolean;
  saving: boolean;
  error: PreferencesError | null;
  localLanguageOverride: LocalLanguage | null;
  saveChanges: (changes: PreferencesPatch) => Promise<boolean>;
  setTheme: (mode: ThemeMode) => Promise<boolean>;
  setLanguage: (language: LanguageCode) => Promise<boolean>;
  setColorAccent: (accent: ColorAccent) => Promise<boolean>;
  retry: () => Promise<boolean>;
}

interface Session {
  userId: number | null;
  token: string | null;
  generation: number;
}

// Un único documento decide las preferencias y la excepción de idioma.
interface StoredState {
  version: 1;
  preferences: ProfilePreferences | null;
  localLanguageOverride: LocalLanguage | null;
  cleanupPending: boolean;
}

interface Scope extends Session {
  alive: boolean;
  busy: boolean;
  initialized: boolean;
  state: StoredState;
  retry: (() => Promise<boolean>) | null;
  controllers: Set<AbortController>;
}

const PreferencesContext =
  createContext<PreferencesContextType | null>(null);

const emptyState = (): StoredState => ({
  version: 1, preferences: null,
  localLanguageOverride: null, cleanupPending: false,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Idioma guardado en el servidor (ES/EN/FR/PT) -> idioma de la app; sin preferencias, español. */
const toAppLanguage = (ui: PreferencesLanguage | undefined): LanguageCode =>
  (ui ? ui.toLowerCase() : 'es') as LanguageCode;

/** Solo para leer overrides guardados en el dispositivo antes de que el servidor aceptara FR y PT. */
const isLocalLanguage = (value: unknown): value is LocalLanguage =>
  value === 'fr' || value === 'pt';

const keyFor = (scope: Session, name: string): string =>
  `@profile_${name}:${scope.userId === null ? 'guest' : scope.userId}`;

const sameSession = (a: Session, b: Session): boolean =>
  a.userId === b.userId && a.token === b.token
  && a.generation === b.generation;

const parseStoredState = (raw: string): {
  state: StoredState;
  invalidPreferences: boolean;
} => {
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) || value.version !== 1
    || !(value.localLanguageOverride === null
      || isLocalLanguage(value.localLanguageOverride))
    || typeof value.cleanupPending !== 'boolean'
  ) throw new Error('Caché local inválida');

  let preferences: ProfilePreferences | null = null;
  let invalidPreferences = false;
  if (value.preferences !== null) {
    try {
      preferences = parsePreferencesResponse(value.preferences);
    } catch {
      invalidPreferences = true;
    }
  }

  return {
    state: {
      version: 1, preferences,
      localLanguageOverride: value.localLanguageOverride,
      cleanupPending: value.cleanupPending,
    },
    invalidPreferences,
  };
};

export const PreferencesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    user, token, isAuthenticated, isLoading: authLoading,
    sessionGeneration, isSessionCurrent,
  } = useAuth();
  const {
    applyTheme, applyColorAccent,
    setPreferenceScope: setThemeScope,
  } = useTheme();
  const {
    applyLanguage,
    setPreferenceScope: setLanguageScope,
  } = useLanguage();

  const userId = isAuthenticated ? user?.id_usuario ?? null : null;
  const sessionToken = userId === null ? null : token;
  const boundSession = useMemo<Session>(() => ({
    userId, token: sessionToken, generation: sessionGeneration,
  }), [userId, sessionToken, sessionGeneration]);

  const renderedSessionRef = useRef(boundSession);
  renderedSessionRef.current = boundSession;
  const scopeRef = useRef<Scope | null>(null);
  const storageQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);
  const [override, setOverride] = useState<LocalLanguage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<PreferencesError | null>(null);

  const isCurrent = useCallback((scope: Scope): boolean =>
    scope.alive && scopeRef.current === scope
    && sameSession(scope, renderedSessionRef.current)
    && isSessionCurrent(scope.generation),
  [isSessionCurrent]);

  // También vincula las acciones públicas a su render de origen.
  const getBoundScope = useCallback((): Scope | null => {
    const scope = scopeRef.current;
    return scope && sameSession(scope, boundSession) && isCurrent(scope)
      ? scope : null;
  }, [boundSession, isCurrent]);

  const enqueueStorage = useCallback(<T,>(
    work: () => Promise<T>,
  ): Promise<T> => {
    const operation = storageQueueRef.current.then(work);
    storageQueueRef.current = operation.then(
      () => undefined, () => undefined,
    );
    return operation;
  }, []);

  const applyState = useCallback((scope: Scope): void => {
    if (!isCurrent(scope)) return;
    const { preferences: next, localLanguageOverride } = scope.state;
    setPreferences(next);
    setOverride(localLanguageOverride);

    // Sin caché válida, el tema y el idioma base son LIGHT/ES.
    // No se modifica el acento hidratado por ThemeContext.
    applyTheme(next?.theme === 'DARK' ? 'dark' : 'light');
    applyLanguage(
      localLanguageOverride ?? toAppLanguage(next?.uiLanguage),
    );
  }, [applyTheme, applyLanguage, isCurrent]);

  const cleanLegacyKeys = useCallback(async (scope: Scope): Promise<void> => {
    await enqueueStorage(async () => {
      if (!isCurrent(scope)) return;
      const snapshot = scope.state;
      const language = snapshot.localLanguageOverride
        ?? toAppLanguage(snapshot.preferences?.uiLanguage);

      await AsyncStorage.multiSet([
        [keyFor(scope, 'language'), language],
        [keyFor(scope, 'theme'),
          snapshot.preferences?.theme === 'DARK' ? 'dark' : 'light'],
      ]);
      if (!isCurrent(scope)) return;

      await AsyncStorage.removeItem(keyFor(scope, 'language_override'));
      if (!isCurrent(scope)) return;

      const complete: StoredState = { ...snapshot, cleanupPending: false };
      await AsyncStorage.setItem(
        keyFor(scope, 'preferences_state'), JSON.stringify(complete),
      );
      if (isCurrent(scope)) scope.state = complete;
    });
  }, [enqueueStorage, isCurrent]);

  const persistState = useCallback(async (scope: Scope): Promise<void> => {
    // Primero se publica el documento autoritativo, con limpieza pendiente.
    await enqueueStorage(async () => {
      if (!isCurrent(scope)) return;
      const pending: StoredState = { ...scope.state, cleanupPending: true };
      scope.state = pending;
      await AsyncStorage.setItem(
        keyFor(scope, 'preferences_state'), JSON.stringify(pending),
      );
    });
    if (isCurrent(scope)) await cleanLegacyKeys(scope);
  }, [cleanLegacyKeys, enqueueStorage, isCurrent]);

  const runOperation = useCallback(async (
    scope: Scope,
    kind: OperationKind,
    work: () => Promise<void>,
    retryOperation: () => Promise<boolean>,
  ): Promise<boolean> => {
    if (!isCurrent(scope)) return false;
    if (scope.busy || (kind !== 'load' && !scope.initialized)) {
      setError({ kind: 'busy', message: 'Espera a que termine la operación actual' });
      return false;
    }
    scope.busy = true;
    scope.retry = null;
    setError(null);
    if (kind === 'load') setLoading(true);
    else setSaving(true);

    try {
      await work();
      return isCurrent(scope);
    } catch {
      if (!isCurrent(scope)) return false;
      const messages: Record<OperationKind, string> = {
        load: 'No se pudieron cargar las preferencias. Se conserva el valor disponible',
        save: 'No se pudo guardar el cambio. Se conserva el valor confirmado',
        local: 'No se pudo guardar el cambio local. Se conserva el valor anterior',
        cache: 'No se pudo completar la persistencia local. Puedes reintentar',
      };
      setError({ kind, message: messages[kind] });
      scope.retry = retryOperation;
      return false;
    } finally {
      scope.busy = false;
      if (isCurrent(scope)) {
        if (kind === 'load') setLoading(false);
        else setSaving(false);
      }
    }
  }, [isCurrent]);

  const repairPersistence = useCallback((scope: Scope): Promise<boolean> =>
    runOperation(
      scope, 'cache', () => persistState(scope),
      () => repairPersistence(scope),
    ),
  [persistState, runOperation]);

  const cacheWarning = useCallback((scope: Scope): void => {
    if (!isCurrent(scope)) return;
    setError({
      kind: 'cache',
      message: 'Valor confirmado; la persistencia o limpieza local quedó pendiente',
    });
    scope.retry = () => repairPersistence(scope);
  }, [isCurrent, repairPersistence]);

  const loadScope = useCallback((scope: Scope): Promise<boolean> =>
    runOperation(scope, 'load', async () => {
      await enqueueStorage(async () => {});
      if (!isCurrent(scope)) return;

      if (!scope.initialized) {
        await Promise.all([
          setThemeScope(scope.userId),
          setLanguageScope(scope.userId),
        ]);
        if (!isCurrent(scope)) return;

        if (scope.userId === null || !scope.token) {
          scope.initialized = true;
          return;
        }

        // Elimina el tema/idioma base local antes de intentar GET.
        // El acento permanece intacto.
        applyState(scope);

        const results = await enqueueStorage(async () => {
          if (!isCurrent(scope)) return null;
          return Promise.allSettled([
            AsyncStorage.getItem(keyFor(scope, 'preferences_state')),
            AsyncStorage.getItem(keyFor(scope, 'preferences')),
            AsyncStorage.getItem(keyFor(scope, 'language_override')),
            AsyncStorage.getItem(keyFor(scope, 'language')),
          ]);
        });
        if (!isCurrent(scope) || !results) return;

        const canonical = results[0];
        if (canonical.status === 'fulfilled' && canonical.value !== null) {
          // Con documento canónico, nunca resucita una excepción heredada.
          try {
            const parsed = parseStoredState(canonical.value);
            scope.state = parsed.state;
            if (parsed.invalidPreferences) cacheWarning(scope);
          } catch {
            scope.state = emptyState();
            cacheWarning(scope);
          }
        } else if (canonical.status === 'fulfilled') {
          // Migración de las claves locales anteriores, solo de este usuario.
          const oldCache = results[1];
          if (oldCache.status === 'fulfilled' && oldCache.value) {
            try {
              scope.state.preferences =
                parsePreferencesResponse(JSON.parse(oldCache.value));
            } catch {
              scope.state.preferences = null;
            }
          }
          const oldOverride = results[2];
          const oldLanguage = results[3];
          const candidate = oldOverride.status === 'fulfilled'
            && isLocalLanguage(oldOverride.value) ? oldOverride.value
            : oldLanguage.status === 'fulfilled'
              && isLocalLanguage(oldLanguage.value) ? oldLanguage.value : null;
          scope.state.localLanguageOverride = candidate;
        } else {
          // Si no puede leerse la autoridad, no se confía en claves heredadas.
          cacheWarning(scope);
        }

        scope.initialized = true;
        applyState(scope);
      }

      if (!scope.token) return;

      if (scope.state.cleanupPending) {
        try {
          await persistState(scope);
        } catch {
          cacheWarning(scope);
        }
        if (!isCurrent(scope)) return;
      }

      const controller = new AbortController();
      scope.controllers.add(controller);
      try {
        const next = await preferencesService.get({
          token: scope.token, signal: controller.signal,
        });
        if (!isCurrent(scope)) return;

        scope.state = { ...scope.state, preferences: next };
        applyState(scope);
        try {
          await persistState(scope);
        } catch {
          cacheWarning(scope);
        }
      } finally {
        scope.controllers.delete(controller);
      }
    }, () => loadScope(scope)),
  [
    applyState, cacheWarning, enqueueStorage, isCurrent,
    persistState, runOperation, setLanguageScope, setThemeScope,
  ]);

  const saveRemote = useCallback((
    scope: Scope,
    patch: PreferencesPatch,
  ): Promise<boolean> =>
    runOperation(scope, 'save', async () => {
      if (!scope.token || scope.userId === null) throw new Error('Sin sesión');
      const controller = new AbortController();
      scope.controllers.add(controller);
      try {
        const next = await preferencesService.patch(patch, {
          token: scope.token, signal: controller.signal,
        });
        if (!isCurrent(scope)) return;

        scope.state = {
          ...scope.state, preferences: next,
          localLanguageOverride: patch.uiLanguage !== undefined
            ? null : scope.state.localLanguageOverride,
          cleanupPending: true,
        };
        applyState(scope);
        try {
          await persistState(scope);
        } catch {
          cacheWarning(scope);
        }
      } finally {
        scope.controllers.delete(controller);
      }
    }, () => saveRemote(scope, patch)),
  [applyState, cacheWarning, isCurrent, persistState, runOperation]);

  const saveChanges = useCallback((
    changes: PreferencesPatch,
  ): Promise<boolean> => {
    const scope = getBoundScope();
    return scope && scope.userId !== null && scope.token
      ? saveRemote(scope, { ...changes }) : Promise.resolve(false);
  }, [getBoundScope, saveRemote]);

  const setTheme = useCallback((mode: ThemeMode): Promise<boolean> =>
    saveChanges({ theme: mode === 'dark' ? 'DARK' : 'LIGHT' }),
  [saveChanges]);

  const setLanguage = useCallback((language: LanguageCode): Promise<boolean> => {
    const scope = getBoundScope();
    if (!scope || scope.userId === null || !scope.token) return Promise.resolve(false);
    // Los cuatro idiomas se guardan en el servidor; al guardar se descarta un override local antiguo.
    return saveRemote(scope, { uiLanguage: language.toUpperCase() as PreferencesLanguage });
  }, [getBoundScope, saveRemote]);

  const saveAccent = useCallback((
    scope: Scope,
    accent: ColorAccent,
  ): Promise<boolean> =>
    runOperation(scope, 'local', async () => {
      await enqueueStorage(async () => {
        if (!isCurrent(scope)) return;
        await AsyncStorage.setItem(keyFor(scope, 'accent'), accent);
      });
      if (isCurrent(scope)) applyColorAccent(accent);
    }, () => saveAccent(scope, accent)),
  [applyColorAccent, enqueueStorage, isCurrent, runOperation]);

  const setColorAccent = useCallback((accent: ColorAccent): Promise<boolean> => {
    const scope = getBoundScope();
    return scope && scope.userId !== null && scope.token
      ? saveAccent(scope, accent) : Promise.resolve(false);
  }, [getBoundScope, saveAccent]);

  const retry = useCallback((): Promise<boolean> => {
    const scope = getBoundScope();
    if (!scope || scope.busy) return Promise.resolve(false);
    return scope.retry ? scope.retry() : loadScope(scope);
  }, [getBoundScope, loadScope]);

  useEffect(() => {
    const scope: Scope = {
      ...boundSession, alive: true, busy: false, initialized: false,
      state: emptyState(), retry: null, controllers: new Set(),
    };
    scopeRef.current = scope;
    setPreferences(null);
    setOverride(null);
    setLoading(true);
    setSaving(false);
    setError(null);

    void Promise.resolve().then(async () => {
      if (!isCurrent(scope)) return;
      if (authLoading) {
        setLoading(false);
        return;
      }
      await loadScope(scope);
    });

    return () => {
      scope.alive = false;
      for (const controller of scope.controllers) controller.abort();
      scope.controllers.clear();
      if (scopeRef.current === scope) scopeRef.current = null;
    };
  }, [boundSession, authLoading, isCurrent, loadScope]);

  const current = !!scopeRef.current && isCurrent(scopeRef.current);
  const value = useMemo<PreferencesContextType>(() => ({
    preferences: current ? preferences : null,
    loading: authLoading || !current || loading,
    saving: current && saving,
    error: current ? error : null,
    localLanguageOverride: current ? override : null,
    saveChanges, setTheme, setLanguage, setColorAccent, retry,
  }), [
    current, preferences, authLoading, loading, saving, error, override,
    saveChanges, setTheme, setLanguage, setColorAccent, retry,
  ]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  return context;
};
