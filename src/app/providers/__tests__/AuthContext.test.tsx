import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth, isAuthOperationCancelled } from '../AuthContext';
import { api, tokenStorage, userStorage } from '../../../shared/services/api.client';
import { showAlert } from '../../../shared/utils/dialogs';
import { pendingAuthFlow } from '../../../feature/auth/services/pendingAuthFlow';

jest.setTimeout(30000);

// Almacen en memoria: lo que AuthContext guarda o borra se puede comprobar despues.
const mockStore: { token: string | null; user: string | null } = { token: null, user: null };
let mockUnauthorized: (() => void) | null = null;

// El api.client real se carga para usar normalizeApiError; sus almacenes nativos se sustituyen.
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../../shared/services/api.client', () => ({
  ...jest.requireActual('../../../shared/services/api.client'),
  api: { get: jest.fn(), post: jest.fn() },
  tokenStorage: {
    get: jest.fn(async () => mockStore.token),
    set: jest.fn(async (v: string) => { mockStore.token = v; }),
    clear: jest.fn(async () => { mockStore.token = null; }),
  },
  userStorage: {
    get: jest.fn(async () => mockStore.user),
    set: jest.fn(async (u: unknown) => { mockStore.user = JSON.stringify(u); }),
    clear: jest.fn(async () => { mockStore.user = null; }),
  },
  setUnauthorizedHandler: (fn: (() => void) | null) => { mockUnauthorized = fn; },
  resetUnauthorizedGuard: jest.fn(),
}));
jest.mock('../../config/i18n', () => ({ useTranslation: () => ({ language: 'es', t: (key: string) => key }) }));
jest.mock('../../../shared/utils/dialogs', () => ({ showAlert: jest.fn(async () => undefined) }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

const BACKEND_USER = { user_id: 7, name: 'Ana', email: 'ana@x.com' };
const STORED_USER = { id_usuario: 7, nombre: 'Ana', edad: 0, email: 'ana@x.com', tema: true, idioma: 'en', termino_acept: true };

/** Error con la forma de axios: normalizeApiError lo clasifica por status. */
const httpError = (status: number, code?: string) =>
  Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status, data: code ? { code } : {} } });
const networkError = () => Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} });

const renderAuth = async () => {
  const view = await renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider> });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.token = null;
  mockStore.user = null;
  mockUnauthorized = null;
});

describe('AuthContext: restaurar la sesion al abrir la app', () => {
  it('sin token guardado queda sin sesion y no llama al backend', async () => {
    const { result } = await renderAuth();
    expect(result.current.isAuthenticated).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('con token valido pide /users/me y conserva las preferencias guardadas del mismo usuario', async () => {
    mockStore.token = 'tok';
    mockStore.user = JSON.stringify(STORED_USER);
    get.mockResolvedValueOnce({ data: { data: BACKEND_USER } });

    const { result } = await renderAuth();

    expect(get).toHaveBeenCalledWith('/users/me', expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('tok');
    expect(result.current.user).toMatchObject({ id_usuario: 7, nombre: 'Ana', idioma: 'en', tema: true });
  });

  it('con token vencido (401) borra la sesion guardada', async () => {
    mockStore.token = 'viejo';
    mockStore.user = JSON.stringify(STORED_USER);
    get.mockRejectedValueOnce(httpError(401));

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    await waitFor(() => expect(mockStore.token).toBeNull());
    expect(mockStore.user).toBeNull();
  });

  it('sin red mantiene la sesion con el usuario guardado', async () => {
    mockStore.token = 'tok';
    mockStore.user = JSON.stringify(STORED_USER);
    get.mockRejectedValueOnce(networkError());

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('ana@x.com');
    expect(mockStore.token).toBe('tok');
  });

  it('sin red y sin usuario guardado valido, no inventa una sesion', async () => {
    mockStore.token = 'tok';
    mockStore.user = '{"no":"es un usuario"}';
    get.mockRejectedValueOnce(networkError());

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('AuthContext: login, registro y logout', () => {
  it('login correcto guarda token y usuario y deja la sesion iniciada', async () => {
    post.mockResolvedValueOnce({ data: { data: { token: 'nuevo', user: BACKEND_USER } } });
    const { result } = await renderAuth();

    await act(() => result.current.login({ email: 'ana@x.com', password: 'Secreta1!' }));

    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'ana@x.com', password: 'Secreta1!' }, expect.anything());
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockStore.token).toBe('nuevo');
    expect(JSON.parse(mockStore.user!)).toMatchObject({ id_usuario: 7, email: 'ana@x.com' });
  });

  it('login fallido propaga el error y no deja ninguna sesion guardada', async () => {
    post.mockRejectedValueOnce(httpError(400, 'INVALID_CREDENTIALS'));
    const { result } = await renderAuth();

    let thrown: unknown;
    await act(async () => { thrown = await result.current.login({ email: 'ana@x.com', password: 'mala' }).catch(e => e); });

    expect((thrown as { response: { data: { code: string } } }).response.data.code).toBe('INVALID_CREDENTIALS');
    expect(isAuthOperationCancelled(thrown)).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockStore.token).toBeNull();
  });

  it('correo sin verificar (403) no inicia sesion', async () => {
    post.mockRejectedValueOnce(httpError(403, 'EMAIL_NOT_VERIFIED'));
    const { result } = await renderAuth();

    await act(async () => { await result.current.login({ email: 'ana@x.com', password: 'Secreta1!' }).catch(() => undefined); });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('Google y Facebook usan sus rutas con el mismo flujo que el login', async () => {
    post.mockResolvedValue({ data: { data: { token: 't', user: BACKEND_USER } } });
    const { result } = await renderAuth();

    await act(() => result.current.loginWithGoogle('id-token'));
    expect(post).toHaveBeenLastCalledWith('/auth/google', { idToken: 'id-token' }, expect.anything());
    await act(() => result.current.loginWithFacebook('fb-token'));
    expect(post).toHaveBeenLastCalledWith('/auth/facebook', { accessToken: 'fb-token' }, expect.anything());
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('registro envia el consentimiento e informa si se envio el correo', async () => {
    post.mockResolvedValueOnce({ data: { data: { verification_email_sent: true } } });
    const { result } = await renderAuth();

    let registered: unknown;
    await act(async () => {
      registered = await result.current.register({ nombre: 'Ana', edad: 0, email: 'ana@x.com', password: 'Secreta1!', termino_acept: true });
    });

    expect(post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ acceptedTerms: true, termsVersion: expect.any(String) }));
    expect(registered).toEqual({ email: 'ana@x.com', verificationEmailSent: true });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout borra la sesion y los flujos pendientes', async () => {
    post.mockResolvedValueOnce({ data: { data: { token: 'nuevo', user: BACKEND_USER } } });
    const { result } = await renderAuth();
    await act(() => result.current.login({ email: 'ana@x.com', password: 'Secreta1!' }));
    pendingAuthFlow.set({ mode: 'verify', email: 'ana@x.com', password: 'Secreta1!' });

    await act(() => result.current.logout());

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockStore.token).toBeNull();
    expect(pendingAuthFlow.get()).toBeNull();
  });
});

describe('AuthContext: sesion expirada y respuestas viejas', () => {
  it('un 401 en cualquier llamada cierra la sesion y avisa', async () => {
    post.mockResolvedValueOnce({ data: { data: { token: 'nuevo', user: BACKEND_USER } } });
    const { result } = await renderAuth();
    await act(() => result.current.login({ email: 'ana@x.com', password: 'Secreta1!' }));

    await act(async () => { mockUnauthorized?.(); });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(mockStore.token).toBeNull();
    expect(showAlert).toHaveBeenCalledWith(expect.objectContaining({ message: 'sessionExpired' }));
  });

  it('un login viejo que responde tarde no pisa la sesion de un login posterior', async () => {
    let answerFirst!: (v: unknown) => void;
    post
      .mockImplementationOnce(() => new Promise(resolve => { answerFirst = resolve; }))
      .mockResolvedValueOnce({ data: { data: { token: 'segundo', user: { ...BACKEND_USER, user_id: 8 } } } });
    const { result } = await renderAuth();

    let first!: Promise<unknown>;
    await act(async () => { first = result.current.login({ email: 'a@x.com', password: 'x' }).catch(e => e); });
    await act(() => result.current.login({ email: 'b@x.com', password: 'y' }));
    await act(async () => { answerFirst({ data: { data: { token: 'primero', user: BACKEND_USER } } }); });

    expect(isAuthOperationCancelled(await first)).toBe(true);
    expect(result.current.token).toBe('segundo');
    expect(result.current.user?.id_usuario).toBe(8);
    expect(mockStore.token).toBe('segundo');
  });
});

describe('useAuth', () => {
  it('fuera de AuthProvider lanza un error claro', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useAuth())).rejects.toThrow('useAuth debe usarse dentro de AuthProvider');
    spy.mockRestore();
  });
});
