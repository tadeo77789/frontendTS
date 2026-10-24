import { act, renderHook } from '@testing-library/react-native';
import { showAlert, showError } from '../../../../shared/utils/dialogs';
import { pendingAuthFlow } from '../../services/pendingAuthFlow';
import { useLoginForm } from '../useLoginForm';
import { useRegisterForm } from '../useRegisterForm';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();
let mockCancelled = false;

// api.client real (normalizeApiError) con sus almacenes nativos sustituidos.
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('../../../../app/providers/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
  isAuthOperationCancelled: () => mockCancelled,
}));
jest.mock('../../../../app/config/i18n', () => ({ useTranslation: () => ({ language: 'es', t: (key: string) => key }) }));
jest.mock('../../../../shared/utils/dialogs', () => ({ showAlert: jest.fn(), showError: jest.fn() }));

const httpError = (status: number, code?: string) =>
  Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status, data: code ? { code } : {} } });
const networkError = () => Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} });

beforeEach(() => {
  jest.clearAllMocks();
  mockCancelled = false;
  pendingAuthFlow.clear();
});

describe('useLoginForm', () => {
  const renderLogin = async () => (await renderHook(() => useLoginForm())).result;

  it('sin datos no llama al backend y marca los dos campos', async () => {
    const result = await renderLogin();
    await act(() => result.current.handleLogin());
    expect(mockLogin).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({ email: 'loginEmailRequired', password: 'loginPasswordRequired' });
  });

  it('el error del correo aparece al salir del campo y se actualiza al escribir', async () => {
    const result = await renderLogin();
    await act(() => result.current.setEmail('ana@'));
    expect(result.current.errors.email).toBeUndefined();

    await act(() => result.current.handleEmailBlur());
    expect(result.current.errors.email).toBe('loginEmailInvalid');

    await act(() => result.current.setEmail('ana@x.com'));
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.emailValid).toBe(true);
  });

  it('un usuario sin @ recibe el aviso de que debe usar el correo', async () => {
    const result = await renderLogin();
    await act(() => result.current.setEmail('ana'));
    await act(() => result.current.handleEmailBlur());
    expect(result.current.errors.email).toBe('loginEmailNotUser');
  });

  it('envia el correo normalizado y la contraseña', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const result = await renderLogin();
    await act(() => result.current.setEmail('  Ana@X.com '));
    await act(() => result.current.setPassword('Secreta1!'));

    await act(() => result.current.handleLogin());

    expect(mockLogin).toHaveBeenCalledWith({ email: 'ana@x.com', password: 'Secreta1!' });
    expect(showError).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('correo sin verificar: guarda el flujo pendiente y abre la verificacion', async () => {
    mockLogin.mockRejectedValueOnce(httpError(403, 'EMAIL_NOT_VERIFIED'));
    const result = await renderLogin();
    await act(() => result.current.setEmail('ana@x.com'));
    await act(() => result.current.setPassword('Secreta1!'));

    await act(() => result.current.handleLogin());

    expect(pendingAuthFlow.get()).toMatchObject({ mode: 'verify', email: 'ana@x.com', password: 'Secreta1!' });
    expect(showAlert).toHaveBeenCalledWith(expect.objectContaining({ message: 'loginConfirmEmail' }));
    expect(mockNavigate).toHaveBeenCalledWith('VerifyCode', { mode: 'verify' });
  });

  it.each([
    [networkError(), 'loginNetworkError'],
    [httpError(500), 'serverUnavailable'],
    [httpError(403, 'ACCOUNT_BLOCKED'), 'loginAccountBlocked'],
    [httpError(400, 'INVALID_CREDENTIALS'), 'loginErrorMsg'],
  ])('muestra el mensaje que corresponde al error (%#)', async (error, message) => {
    mockLogin.mockRejectedValueOnce(error);
    const result = await renderLogin();
    await act(() => result.current.setEmail('ana@x.com'));
    await act(() => result.current.setPassword('x'));

    await act(() => result.current.handleLogin());

    expect(showError).toHaveBeenCalledWith(message, 'error');
    expect(result.current.loading).toBe(false);
  });

  it('un login cancelado por otra sesion no muestra error', async () => {
    mockCancelled = true;
    mockLogin.mockRejectedValueOnce(new Error('cancelado'));
    const result = await renderLogin();
    await act(() => result.current.setEmail('ana@x.com'));
    await act(() => result.current.setPassword('x'));

    await act(() => result.current.handleLogin());

    expect(showError).not.toHaveBeenCalled();
  });
});

describe('useRegisterForm', () => {
  const fill = async (over: Partial<{ nombre: string; correo: string; password: string; terminos: boolean }> = {}) => {
    const { result } = await renderHook(() => useRegisterForm());
    const values = { nombre: 'Ana', correo: 'Ana@X.com', password: 'Secreta1!', terminos: true, ...over };
    await act(() => {
      result.current.setField('nombre', values.nombre);
      result.current.setField('correo', values.correo);
      result.current.setField('password', values.password);
      result.current.setField('terminos', values.terminos);
    });
    return result;
  };

  it('formulario vacio marca todos los campos y no registra', async () => {
    const result = await fill({ nombre: ' ', correo: '', password: '', terminos: false });
    await act(() => result.current.handleRegister());
    expect(mockRegister).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({
      nombre: 'registerNameRequired', correo: 'registerEmailRequired',
      password: 'registerPasswordRequired', terminos: 'registerTermsRequired',
    });
  });

  it.each([
    [{ correo: 'ana@' }, 'correo', 'registerEmailInvalid'],
    [{ password: 'Ab1!' }, 'password', 'registerPasswordShort'],
    [{ password: 'abcdefgh' }, 'password', 'registerPasswordWeak'],
  ])('valida %j', async (over, field, message) => {
    const result = await fill(over);
    await act(() => result.current.handleRegister());
    expect(mockRegister).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({ [field]: message });
  });

  it('registra con el consentimiento, guarda el flujo y abre la verificacion', async () => {
    mockRegister.mockResolvedValueOnce({ email: 'ana@x.com', verificationEmailSent: true });
    const result = await fill();

    await act(() => result.current.handleRegister());

    expect(mockRegister).toHaveBeenCalledWith({ nombre: 'Ana', edad: 0, email: 'ana@x.com', password: 'Secreta1!', termino_acept: true });
    expect(pendingAuthFlow.get()).toMatchObject({ mode: 'verify', email: 'ana@x.com', password: 'Secreta1!' });
    expect(pendingAuthFlow.get()?.resendAvailableAt).toBeGreaterThan(Date.now());
    expect(showAlert).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('VerifyCode', { mode: 'verify' });
  });

  it('si el correo no salio, avisa y abre la verificacion igual', async () => {
    mockRegister.mockResolvedValueOnce({ email: 'ana@x.com', verificationEmailSent: false });
    const result = await fill();
    await act(() => result.current.handleRegister());
    expect(showAlert).toHaveBeenCalledWith(expect.objectContaining({ message: 'registerCodeNotSent' }));
    expect(mockNavigate).toHaveBeenCalledWith('VerifyCode', { mode: 'verify' });
  });

  it.each([
    [networkError(), 'loginNetworkError'],
    [httpError(503), 'serverUnavailable'],
    [httpError(409, 'EMAIL_ALREADY_EXISTS'), 'registerEmailExists'],
    [httpError(400), 'registerErrorMsg'],
  ])('muestra el mensaje que corresponde al error (%#)', async (error, message) => {
    mockRegister.mockRejectedValueOnce(error);
    const result = await fill();
    await act(() => result.current.handleRegister());
    expect(showError).toHaveBeenCalledWith(message, 'error');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
