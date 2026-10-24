import { renderHook, waitFor } from '@testing-library/react-native';
import { showConfirm, showError } from '../../../../shared/utils/dialogs';
import { useGoogleLogin } from '../useGoogleLogin';
import { useFacebookLogin } from '../useFacebookLogin';

// Respuesta del proveedor que devuelve el mock de expo-auth-session en cada prueba.
let mockResponse: unknown = null;
const mockLoginWithGoogle = jest.fn();
const mockLoginWithFacebook = jest.fn();

// api.client real (normalizeApiError) con sus almacenes nativos sustituidos.
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-auth-session/providers/google', () => ({ useIdTokenAuthRequest: () => [{}, mockResponse, jest.fn()] }));
jest.mock('expo-auth-session/providers/facebook', () => ({ useAuthRequest: () => [{}, mockResponse, jest.fn()] }));
jest.mock('../../../../app/providers/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: mockLoginWithGoogle, loginWithFacebook: mockLoginWithFacebook }),
  isAuthOperationCancelled: () => false,
}));
jest.mock('../../../../app/config/i18n', () => ({ useTranslation: () => ({ language: 'es', t: (key: string) => key }) }));
jest.mock('../../../../shared/utils/dialogs', () => ({ showConfirm: jest.fn(), showError: jest.fn() }));

const confirm = showConfirm as jest.Mock;
const termsRequired = () => Object.assign(new Error('HTTP 403'), { isAxiosError: true, response: { status: 403, data: { code: 'TERMS_REQUIRED' } } });

const cases = [
  {
    name: 'Google',
    useHook: useGoogleLogin,
    login: mockLoginWithGoogle,
    response: { type: 'success', params: { id_token: 'id-token' } },
    token: 'id-token',
  },
  {
    name: 'Facebook',
    useHook: useFacebookLogin,
    login: mockLoginWithFacebook,
    response: { type: 'success', params: {}, authentication: { accessToken: 'fb-token' } },
    token: 'fb-token',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockResponse = null;
});

describe.each(cases)('login con $name: consentimiento de cuenta nueva', ({ useHook, login, response, token }) => {
  it('cuenta existente entra sin pedir el consentimiento', async () => {
    login.mockResolvedValueOnce(undefined);
    mockResponse = response;

    await renderHook(() => useHook());

    await waitFor(() => expect(login).toHaveBeenCalledWith(token, false));
    expect(confirm).not.toHaveBeenCalled();
  });

  it('cuenta nueva: pide el consentimiento y reintenta con el mismo token', async () => {
    login.mockRejectedValueOnce(termsRequired()).mockResolvedValueOnce(undefined);
    confirm.mockResolvedValueOnce(true);
    mockResponse = response;

    await renderHook(() => useHook());

    await waitFor(() => expect(login).toHaveBeenLastCalledWith(token, true));
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'socialTermsTitle', confirmText: 'socialTermsAccept' }));
    expect(showError).not.toHaveBeenCalled();
  });

  it('si no acepta, no crea la cuenta ni muestra un error', async () => {
    login.mockRejectedValueOnce(termsRequired());
    confirm.mockResolvedValueOnce(false);
    mockResponse = response;

    const { result } = await renderHook(() => useHook());

    await waitFor(() => expect(confirm).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(login).toHaveBeenCalledTimes(1);
    expect(showError).not.toHaveBeenCalled();
  });

  it('otro error del backend no pide el consentimiento y se muestra al usuario', async () => {
    login.mockRejectedValueOnce(Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} }));
    mockResponse = response;

    await renderHook(() => useHook());

    await waitFor(() => expect(showError).toHaveBeenCalledWith('loginNetworkError', 'error'));
    expect(confirm).not.toHaveBeenCalled();
  });
});
