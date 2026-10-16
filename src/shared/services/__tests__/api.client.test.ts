import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../app/config/api.config';
import {
  api,
  getCurrentUserId,
  normalizeApiError,
  resetUnauthorizedGuard,
  setUnauthorizedHandler,
  tokenStorage,
  userStorage,
} from '../api.client';

// Almacenes en memoria: los tests no tocan el llavero ni el disco del dispositivo.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { store.set(key, value); }),
    deleteItemAsync: jest.fn(async (key: string) => { store.delete(key); }),
  };
});
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const response = (config: InternalAxiosRequestConfig, status = 200): AxiosResponse => ({
  data: {}, status, statusText: '', headers: {}, config,
});

// Adaptador falso: guarda la cabecera que salió y responde con el estado pedido.
const capture = (status = 200) => {
  const sent: Array<string | undefined> = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config.headers.Authorization as string | undefined);
    if (status >= 400) {
      throw new AxiosError('fallo', 'ERR_BAD_RESPONSE', config, {}, response(config, status));
    }
    return response(config, status);
  };
  return { sent, adapter };
};

const axiosError = (status?: number, code?: unknown): AxiosError => {
  const err = new AxiosError('fallo');
  if (status !== undefined) {
    err.response = { status, data: { code }, statusText: '', headers: {}, config: {} as InternalAxiosRequestConfig };
  }
  return err;
};

beforeEach(async () => {
  await tokenStorage.clear();
  await userStorage.clear();
  setUnauthorizedHandler(null);
  resetUnauthorizedGuard();
  jest.clearAllMocks();
});

describe('normalizeApiError', () => {
  it('sin respuesta del servidor es NETWORK', () => {
    expect(normalizeApiError(axiosError())).toEqual({ code: 'NETWORK' });
  });

  it('un error que no viene de axios es UNKNOWN', () => {
    expect(normalizeApiError(new Error('x'))).toEqual({ code: 'UNKNOWN' });
    expect(normalizeApiError(undefined)).toEqual({ code: 'UNKNOWN' });
  });

  it('401 siempre es UNAUTHORIZED, aunque el cuerpo traiga otro código', () => {
    expect(normalizeApiError(axiosError(401, 'INVALID_CREDENTIALS'))).toEqual({ status: 401, code: 'UNAUTHORIZED' });
  });

  it('5xx es SERVER', () => {
    expect(normalizeApiError(axiosError(502))).toEqual({ status: 502, code: 'SERVER' });
  });

  it('respeta los códigos conocidos del servidor', () => {
    expect(normalizeApiError(axiosError(409, 'EMAIL_ALREADY_EXISTS'))).toEqual({ status: 409, code: 'EMAIL_ALREADY_EXISTS' });
    expect(normalizeApiError(axiosError(403, 'EMAIL_NOT_VERIFIED'))).toEqual({ status: 403, code: 'EMAIL_NOT_VERIFIED' });
  });

  it('INVALID_BODY se trata como VALIDATION_ERROR', () => {
    expect(normalizeApiError(axiosError(400, 'INVALID_BODY'))).toEqual({ status: 400, code: 'VALIDATION_ERROR' });
  });

  it('códigos desconocidos caen al estado HTTP', () => {
    expect(normalizeApiError(axiosError(400, 'RARO')).code).toBe('VALIDATION_ERROR');
    expect(normalizeApiError(axiosError(403, 'RARO')).code).toBe('PERMISSION_ERROR');
    expect(normalizeApiError(axiosError(404)).code).toBe('NOT_FOUND');
    expect(normalizeApiError(axiosError(409, 'RARO')).code).toBe('UNKNOWN');
  });
});

describe('token en las peticiones', () => {
  it('adjunta el token guardado a las rutas de la API', async () => {
    await tokenStorage.set('tok-1');
    const { sent, adapter } = capture();
    await api.get('/users/me', { adapter });
    expect(sent).toEqual(['Bearer tok-1']);
  });

  it('sin token la petición sale sin Authorization', async () => {
    const { sent, adapter } = capture();
    await api.get('/lexicon', { adapter });
    expect(sent).toEqual([undefined]);
  });

  it('no envía el token a otros dominios', async () => {
    await tokenStorage.set('tok-1');
    const { sent, adapter } = capture();
    await api.get('https://otro-sitio.example/robar', { adapter });
    expect(sent).toEqual([undefined]);
  });

  it('no envía el token fuera del prefijo de la API en el mismo dominio', async () => {
    await tokenStorage.set('tok-1');
    const { sent, adapter } = capture();
    const base = new URL(API_BASE_URL);
    await api.get(`${base.origin}/otra-ruta`, { adapter });
    expect(sent).toEqual([undefined]);
  });

  it('conserva el token que la petición ya traía', async () => {
    await tokenStorage.set('tok-nuevo');
    const { sent, adapter } = capture();
    await api.get('/users/me', { adapter, headers: { Authorization: 'Bearer tok-viejo' } });
    expect(sent).toEqual(['Bearer tok-viejo']);
  });
});

describe('sesión caducada (401)', () => {
  it('avisa una sola vez hasta que empieza otra sesión', async () => {
    await tokenStorage.set('tok-1');
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    const { adapter } = capture(401);

    await expect(api.get('/users/me', { adapter })).rejects.toBeInstanceOf(AxiosError);
    await expect(api.get('/users/me', { adapter })).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    resetUnauthorizedGuard();
    await expect(api.get('/users/me', { adapter })).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).toHaveBeenCalledTimes(2);
  });

  it('un 401 tardío de la sesión anterior no cierra la nueva', async () => {
    await tokenStorage.set('tok-nuevo');
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    const { adapter } = capture(401);

    await expect(api.get('/users/me', { adapter, headers: { Authorization: 'Bearer tok-viejo' } })).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('un 401 sin token (por ejemplo, login fallido) no avisa', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    const { adapter } = capture(401);

    await expect(api.post('/auth/login', {}, { adapter })).rejects.toBeInstanceOf(AxiosError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('almacenamiento de la sesión en el móvil', () => {
  it('guarda el token en SecureStore con una clave válida (sin @)', async () => {
    await tokenStorage.set('tok-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'tok-1');
    expect(await tokenStorage.get()).toBe('tok-1');
  });

  it('clear borra el token de SecureStore y de AsyncStorage', async () => {
    await tokenStorage.set('tok-1');
    await tokenStorage.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
    expect(await tokenStorage.get()).toBeNull();
  });
});

describe('getCurrentUserId', () => {
  it('lee el id del usuario guardado', async () => {
    await AsyncStorage.setItem('@auth_user', JSON.stringify({ id_usuario: 7 }));
    expect(await getCurrentUserId()).toBe(7);
  });

  it('sin usuario, con id no numérico o con JSON roto devuelve null', async () => {
    expect(await getCurrentUserId()).toBeNull();
    await AsyncStorage.setItem('@auth_user', JSON.stringify({ id_usuario: '7' }));
    expect(await getCurrentUserId()).toBeNull();
    await AsyncStorage.setItem('@auth_user', '{roto');
    expect(await getCurrentUserId()).toBeNull();
  });
});
