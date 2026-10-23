import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  User,
  AuthState,
  LoginPayload,
  RegisterPayload,
} from '../../shared/types';
import {
  api,
  tokenStorage,
  userStorage,
  normalizeApiError,
  setUnauthorizedHandler,
  resetUnauthorizedGuard,
} from '../../shared/services/api.client';
import { ENDPOINTS } from '../config/api.config';
import { useTranslation } from '../config/i18n';
import { pendingAuthFlow } from '../../feature/auth/services/pendingAuthFlow';
import { passwordResetFlow } from '../../feature/auth/services/passwordResetFlow';
import { buildRegisterBody } from '../../feature/auth/services/auth.service';
import { showAlert } from '../../shared/utils/dialogs';

export class AuthOperationCancelledError extends Error {
  readonly code = 'AUTH_OPERATION_CANCELLED';

  constructor() {
    super('La operación pertenece a una sesión anterior');
    this.name = 'AuthOperationCancelledError';
  }
}

export const isAuthOperationCancelled = (
  error: unknown,
): error is AuthOperationCancelledError =>
  error instanceof AuthOperationCancelledError;

interface BackendUser {
  user_id: number;
  name: string;
  email: string;
}

const mapBackendUser = (
  user: BackendUser,
  extras?: Partial<User>,
): User => {
  const matchingExtras =
    extras?.id_usuario === user.user_id ? extras : undefined;

  return {
    id_usuario: user.user_id,
    nombre: user.name,
    edad: matchingExtras?.edad ?? 0,
    email: user.email,
    tema: matchingExtras?.tema ?? false,
    idioma: matchingExtras?.idioma ?? 'es',
    termino_acept: matchingExtras?.termino_acept ?? true,
  };
};

const parseStoredUser = (raw: string | null): User | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object'
      || parsed === null
      || Array.isArray(parsed)
    ) {
      return null;
    }

    const user = parsed as Partial<User>;
    if (
      typeof user.id_usuario !== 'number'
      || !Number.isInteger(user.id_usuario)
      || user.id_usuario <= 0
      || typeof user.nombre !== 'string'
      || typeof user.email !== 'string'
    ) {
      return null;
    }

    return mapBackendUser({
      user_id: user.id_usuario,
      name: user.nombre,
      email: user.email,
    }, user);
  } catch {
    return null;
  }
};

export interface RegisterResult {
  email: string;
  verificationEmailSent: boolean;
}

interface AuthContextType extends AuthState {
  sessionGeneration: number;
  isSessionCurrent: (generation: number) => boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

interface SessionState extends AuthState {
  sessionGeneration: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

const EMPTY_STATE: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<SessionState>({
    ...EMPTY_STATE,
    isLoading: true,
    sessionGeneration: 0,
  });

  const mountedRef = useRef(true);
  const generationRef = useRef(0);
  const controllersRef = useRef(new Set<AbortController>());
  const storageQueueRef = useRef<Promise<void>>(Promise.resolve());
  const tRef = useRef(t);
  tRef.current = t;

  const isSessionCurrent = useCallback(
    (generation: number): boolean =>
      mountedRef.current && generationRef.current === generation,
    [],
  );

  const assertSessionCurrent = useCallback((
    generation: number,
  ): void => {
    if (!isSessionCurrent(generation)) {
      throw new AuthOperationCancelledError();
    }
  }, [isSessionCurrent]);

  const abortRequests = useCallback((): void => {
    for (const controller of controllersRef.current) {
      controller.abort();
    }
    controllersRef.current.clear();
  }, []);

  const enqueueStorage = useCallback(<T,>(
    work: () => Promise<T>,
  ): Promise<T> => {
    const operation = storageQueueRef.current.then(work);

    storageQueueRef.current = operation.then(
      () => undefined,
      () => undefined,
    );

    return operation;
  }, []);

  const beginSessionChange = useCallback((
    restoring: boolean,
  ): number => {
    if (!mountedRef.current) {
      throw new AuthOperationCancelledError();
    }

    const generation = ++generationRef.current;
    abortRequests();

    setState({
      ...EMPTY_STATE,
      isLoading: restoring,
      sessionGeneration: generation,
    });

    return generation;
  }, [abortRequests]);

  const clearStoredSession = useCallback((
    generation: number,
  ): Promise<void> =>
    enqueueStorage(async () => {
      if (!isSessionCurrent(generation)) return;

      await Promise.all([
        tokenStorage.clear(),
        userStorage.clear(),
      ]).catch(() => undefined);
    }),
  [enqueueStorage, isSessionCurrent]);

  const clearSession = useCallback(async (): Promise<number> => {
    const generation = beginSessionChange(false);
    await clearStoredSession(generation);
    return generation;
  }, [beginSessionChange, clearStoredSession]);

  const persistSession = useCallback(async (
    generation: number,
    user: User,
    token: string,
  ): Promise<void> => {
    await enqueueStorage(async () => {
      assertSessionCurrent(generation);
      await tokenStorage.set(token);

      assertSessionCurrent(generation);
      await userStorage.set(user);

      assertSessionCurrent(generation);
      resetUnauthorizedGuard();

      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
        sessionGeneration: generation,
      });
    });
  }, [assertSessionCurrent, enqueueStorage]);

  // El ciclo de vida invalida cualquier operación de sesión pendiente.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      abortRequests();
    };
  }, [abortRequests]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!mountedRef.current) return;

      void clearSession().then(generation => {
        if (!isSessionCurrent(generation)) return;

        void showAlert({
          message: tRef.current('sessionExpired'),
          icon: 'warning',
        });
      });
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession, isSessionCurrent]);

  // Solo la restauración inicial activa la carga global.
  useEffect(() => {
    const generation = beginSessionChange(true);
    const controller = new AbortController();
    controllersRef.current.add(controller);

    void (async () => {
      try {
        const snapshot = await enqueueStorage(async () => {
          if (!isSessionCurrent(generation)) return null;

          const token = await tokenStorage.get();
          const rawUser = await userStorage.get();

          return {
            token,
            cachedUser: parseStoredUser(rawUser),
          };
        });

        if (!isSessionCurrent(generation) || !snapshot) return;

        const { token, cachedUser } = snapshot;

        if (!token) {
          await clearSession();
          return;
        }

        try {
          const { data } = await api.get(ENDPOINTS.me, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });

          if (!isSessionCurrent(generation)) return;

          const user = mapBackendUser(
            data.data as BackendUser,
            cachedUser ?? undefined,
          );

          await persistSession(generation, user, token);
        } catch (error) {
          if (!isSessionCurrent(generation)) return;

          const { code, status } = normalizeApiError(error);

          if (code === 'UNAUTHORIZED' || code === 'NOT_FOUND') {
            await clearSession();
            return;
          }

          const keep =
            code === 'NETWORK'
            || code === 'SERVER'
            || status === 400;

          if (keep && cachedUser) {
            setState({
              user: cachedUser,
              token,
              isLoading: false,
              isAuthenticated: true,
              sessionGeneration: generation,
            });
          } else {
            await clearSession();
          }
        }
      } catch {
        if (isSessionCurrent(generation)) {
          await clearSession();
        }
      } finally {
        controllersRef.current.delete(controller);
      }
    })();

    // Este efecto cancela su solicitud, sin gestionar el montaje.
    return () => {
      controller.abort();
      controllersRef.current.delete(controller);
    };
  }, [
    beginSessionChange,
    clearSession,
    enqueueStorage,
    isSessionCurrent,
    persistSession,
  ]);

  const requestLogin = useCallback(async (
    endpoint: string,
    body: Record<string, string>,
  ): Promise<void> => {
    const generation = beginSessionChange(false);
    const controller = new AbortController();
    controllersRef.current.add(controller);

    try {
      await clearStoredSession(generation);
      assertSessionCurrent(generation);

      const { data } = await api.post(endpoint, body, {
        headers: { Authorization: false },
        signal: controller.signal,
      });

      assertSessionCurrent(generation);

      await persistSession(
        generation,
        mapBackendUser(data.data.user as BackendUser),
        data.data.token as string,
      );

      assertSessionCurrent(generation);
    } catch (error) {
      // Incluye abortos HTTP y operaciones de almacenamiento sustituidas.
      if (!isSessionCurrent(generation)) {
        throw new AuthOperationCancelledError();
      }

      const clearedGeneration = await clearSession();
      assertSessionCurrent(clearedGeneration);

      throw error;
    } finally {
      controllersRef.current.delete(controller);
    }
  }, [
    assertSessionCurrent,
    beginSessionChange,
    clearSession,
    clearStoredSession,
    isSessionCurrent,
    persistSession,
  ]);

  const login = useCallback((
    payload: LoginPayload,
  ): Promise<void> =>
    requestLogin(ENDPOINTS.login, {
      email: payload.email,
      password: payload.password,
    }),
  [requestLogin]);

  const loginWithFacebook = useCallback((
    accessToken: string,
  ): Promise<void> =>
    requestLogin(ENDPOINTS.facebookLogin, { accessToken }),
  [requestLogin]);

  // El backend verifica el ID token con Google y responde igual que /auth/login.
  const loginWithGoogle = useCallback((
    idToken: string,
  ): Promise<void> =>
    requestLogin(ENDPOINTS.googleLogin, { idToken }),
  [requestLogin]);

  const register = useCallback(async (
    payload: RegisterPayload,
  ): Promise<RegisterResult> => {
    const { data } = await api.post(ENDPOINTS.register, buildRegisterBody(payload));

    return {
      email: payload.email,
      verificationEmailSent:
        data?.data?.verification_email_sent === true,
    };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const clearing = clearSession();

    pendingAuthFlow.clear();
    passwordResetFlow.clear();

    await clearing;
  }, [clearSession]);

  const value = useMemo<AuthContextType>(() => ({
    ...state,
    isSessionCurrent,
    login,
    loginWithFacebook,
    loginWithGoogle,
    register,
    logout,
  }), [
    state,
    isSessionCurrent,
    login,
    loginWithFacebook,
    loginWithGoogle,
    register,
    logout,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
};
