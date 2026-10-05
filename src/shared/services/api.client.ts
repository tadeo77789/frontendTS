import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../../app/config/api.config';
import type { User } from '../types';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

// Token: SecureStore en nativo; en web no existe, se usa el almacenamiento del navegador.
export const tokenStorage = {
  get: (): Promise<string | null> =>
    Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string): Promise<void> =>
    Platform.OS === 'web' ? AsyncStorage.setItem(TOKEN_KEY, token) : SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: async (): Promise<void> => {
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};

export const userStorage = {
  get: () => AsyncStorage.getItem(USER_KEY),
  set: (user: User) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => AsyncStorage.removeItem(USER_KEY),
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Solo adjunta el token si la URL final resuelta pertenece al origen y prefijo de la API.
const isApiRequest = (config: InternalAxiosRequestConfig): boolean => {
  try {
    const origin = Platform.OS === 'web' ? (globalThis as { location?: { href: string } }).location?.href : undefined;
    const base = new URL(API_BASE_URL, origin);
    const target = new URL(axios.getUri(config), base.href.endsWith('/') ? base.href : `${base.href}/`);
    const prefix = base.pathname.replace(/\/+$/, '');
    return target.origin === base.origin && (target.pathname === prefix || target.pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
};

api.interceptors.request.use(async (config) => {
  if (!isApiRequest(config)) return config;
  try {
    const token = await tokenStorage.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // sin token: la petición sigue sin Authorization
  }
  return config;
});

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedFired = false;

export const setUnauthorizedHandler = (fn: UnauthorizedHandler | null) => {
  unauthorizedHandler = fn;
};

/** Rearma el aviso de 401; llamar al iniciar una sesión nueva. */
export const resetUnauthorizedGuard = () => {
  unauthorizedFired = false;
};

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    // Solo cuenta como sesión caducada si la petición llevaba el token actual: un 401 tardío
    // de una sesión anterior no debe cerrar la sesión nueva.
    const sent = err.config?.headers?.Authorization;
    if (err.response?.status === 401 && sent && !unauthorizedFired) {
      const current = await tokenStorage.get().catch(() => null);
      if (current && sent === `Bearer ${current}` && !unauthorizedFired) {
        unauthorizedFired = true;
        unauthorizedHandler?.();
      }
    }
    return Promise.reject(err);
  },
);

export type ApiErrorCode =
  | 'VALIDATION_ERROR' | 'PERMISSION_ERROR' | 'NOT_FOUND' | 'ROLE_IN_USE' | 'LAST_ADMIN'
  | 'ROLE_REQUIRED' | 'ROLE_PROTECTED' | 'INVALID_CODE' | 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_BLOCKED'
  | 'INVALID_CREDENTIALS' | 'INVALID_PASSWORD' | 'EMAIL_ALREADY_EXISTS' | 'UNAUTHORIZED' | 'NETWORK' | 'SERVER' | 'UNKNOWN';

export interface NormalizedApiError {
  status?: number;
  code: ApiErrorCode;
}

const KNOWN_CODES: ApiErrorCode[] = [
  'VALIDATION_ERROR', 'PERMISSION_ERROR', 'NOT_FOUND', 'ROLE_IN_USE', 'LAST_ADMIN', 'ROLE_REQUIRED', 'ROLE_PROTECTED',
  'INVALID_CODE', 'EMAIL_NOT_VERIFIED', 'ACCOUNT_BLOCKED', 'INVALID_CREDENTIALS', 'INVALID_PASSWORD', 'EMAIL_ALREADY_EXISTS',
];

/** Reduce un error de axios a {status, code}; nunca incluye cuerpos ni mensajes del servidor. */
export const normalizeApiError = (err: unknown): NormalizedApiError => {
  const e = err as AxiosError<{ code?: unknown }> | undefined;
  const status = e?.response?.status;
  if (!e?.response) return { code: e?.isAxiosError || e?.request ? 'NETWORK' : 'UNKNOWN' };
  if (status === 401) return { status, code: 'UNAUTHORIZED' };
  if (status !== undefined && status >= 500) return { status, code: 'SERVER' };
  const body = e.response.data?.code;
  if (body === 'INVALID_BODY') return { status, code: 'VALIDATION_ERROR' };
  const known = KNOWN_CODES.find((c) => c === body);
  if (known) return { status, code: known };
  if (status === 400) return { status, code: 'VALIDATION_ERROR' };
  if (status === 403) return { status, code: 'PERMISSION_ERROR' };
  if (status === 404) return { status, code: 'NOT_FOUND' };
  return { status, code: 'UNKNOWN' };
};

export const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const raw = await userStorage.get();
    if (!raw) return null;
    const user = JSON.parse(raw) as Partial<User>;
    return typeof user?.id_usuario === 'number' ? user.id_usuario : null;
  } catch {
    return null;
  }
};
