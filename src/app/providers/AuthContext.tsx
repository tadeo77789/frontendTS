import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, AuthState, LoginPayload, RegisterPayload } from '../../shared/types';
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
import { showAlert } from '../../shared/utils/dialogs';

interface BackendUser {
  user_id: number;
  name: string;
  email: string;
}

const mapBackendUser = (u: BackendUser, extras?: Partial<User>): User => ({
  id_usuario: u.user_id,
  nombre: u.name,
  edad: extras?.edad ?? 0,
  email: u.email,
  tema: extras?.tema ?? false,
  idioma: extras?.idioma ?? 'es',
  termino_acept: extras?.termino_acept ?? true,
});

export interface RegisterResult {
  email: string;
  verificationEmailSent: boolean;
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const EMPTY_STATE: AuthState = { user: null, token: null, isLoading: false, isAuthenticated: false };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<AuthState>({ ...EMPTY_STATE, isLoading: true });
  const tRef = useRef(t);
  tRef.current = t;

  const clearSession = useCallback(async () => {
    await Promise.all([tokenStorage.clear(), userStorage.clear()]).catch(() => undefined);
    setState(EMPTY_STATE);
  }, []);

  const persistSession = useCallback(async (user: User, token: string) => {
    await tokenStorage.set(token);
    await userStorage.set(user);
    resetUnauthorizedGuard();
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  // 401 con token: sesión caducada o inválida -> cerrar sesión local y avisar una vez.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession().then(() => showAlert({ message: tRef.current('sessionExpired'), icon: 'warning' }));
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Rehidratación: valida el token guardado con GET /users/me.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) {
          // Restos de la sesión simulada anterior (@auth_user sin token).
          if (!cancelled) await clearSession();
          return;
        }
        try {
          const { data } = await api.get(ENDPOINTS.me);
          const stored = await userStorage.get();
          let extras: Partial<User> | undefined;
          try {
            extras = stored ? (JSON.parse(stored) as Partial<User>) : undefined;
          } catch {
            await userStorage.clear().catch(() => undefined);
          }
          const user = mapBackendUser(data.data as BackendUser, extras);
          await userStorage.set(user);
          if (!cancelled) setState({ user, token, isLoading: false, isAuthenticated: true });
        } catch (err) {
          if (cancelled) return;
          // Solo 401 y 404 de /me (usuario inexistente) invalidan la sesión; red, 5xx y 400 la conservan.
          const { code, status } = normalizeApiError(err);
          if (code === 'UNAUTHORIZED' || code === 'NOT_FOUND') return await clearSession();
          const keep = code === 'NETWORK' || code === 'SERVER' || status === 400;
          let user: User | null = null;
          if (keep) {
            try {
              const raw = await userStorage.get();
              user = raw ? (JSON.parse(raw) as User) : null;
            } catch {
              user = null;
            }
          }
          if (user) setState({ user, token, isLoading: false, isAuthenticated: true });
          else await clearSession();
        }
      } catch {
        if (!cancelled) setState(EMPTY_STATE);
      }
    })();
    return () => { cancelled = true; };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await api.post(ENDPOINTS.login, { email: payload.email, password: payload.password });
    await persistSession(mapBackendUser(data.data.user as BackendUser), data.data.token as string);
  }, [persistSession]);

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterResult> => {
    const { data } = await api.post(ENDPOINTS.register, {
      name: payload.nombre,
      email: payload.email,
      password: payload.password,
    });
    return { email: payload.email, verificationEmailSent: data?.data?.verification_email_sent === true };
  }, []);

  const logout = useCallback(async () => {
    pendingAuthFlow.clear();
    passwordResetFlow.clear();
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextType>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
