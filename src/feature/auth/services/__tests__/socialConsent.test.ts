import { signInWithSocialConsent } from '../socialConsent';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const httpError = (status: number, code: string) =>
  Object.assign(new Error(code), { isAxiosError: true, response: { status, data: { code } } });

describe('signInWithSocialConsent', () => {
  it('cuenta existente: entra al primer intento sin pedir consentimiento', async () => {
    const signIn = jest.fn(async () => undefined);
    const ask = jest.fn(async () => true);
    await expect(signInWithSocialConsent(signIn, ask)).resolves.toBe('signed-in');
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith(false);
    expect(ask).not.toHaveBeenCalled();
  });

  it('cuenta nueva: con TERMS_REQUIRED pide el consentimiento y reintenta aceptando', async () => {
    const signIn = jest.fn()
      .mockRejectedValueOnce(httpError(400, 'TERMS_REQUIRED'))
      .mockResolvedValueOnce(undefined);
    const ask = jest.fn(async () => true);
    await expect(signInWithSocialConsent(signIn, ask)).resolves.toBe('signed-in');
    expect(ask).toHaveBeenCalledTimes(1);
    expect(signIn.mock.calls).toEqual([[false], [true]]);
  });

  it('si la persona no acepta, no reintenta ni crea la cuenta', async () => {
    const signIn = jest.fn().mockRejectedValueOnce(httpError(400, 'TERMS_REQUIRED'));
    await expect(signInWithSocialConsent(signIn, async () => false)).resolves.toBe('declined');
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('otros errores se propagan sin pedir consentimiento', async () => {
    const blocked = httpError(403, 'ACCOUNT_BLOCKED');
    const ask = jest.fn(async () => true);
    await expect(signInWithSocialConsent(jest.fn().mockRejectedValueOnce(blocked), ask)).rejects.toBe(blocked);
    expect(ask).not.toHaveBeenCalled();
  });

  it('un error del reintento tambien se propaga', async () => {
    const network = Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} });
    const signIn = jest.fn()
      .mockRejectedValueOnce(httpError(400, 'TERMS_REQUIRED'))
      .mockRejectedValueOnce(network);
    await expect(signInWithSocialConsent(signIn, async () => true)).rejects.toBe(network);
  });
});
