import * as auth from '../auth.service';
import { api } from '../../../../shared/services/api.client';

jest.mock('../../../../shared/services/api.client', () => ({ api: { post: jest.fn(), delete: jest.fn() } }));

const post = api.post as jest.Mock;
const del = api.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('auth.service: cada llamada usa su ruta y su cuerpo', () => {
  it.each([
    ['verifyEmail', () => auth.verifyEmail('a@x.com', '123456', 'Secreta1!'), '/auth/verify-email', { email: 'a@x.com', code: '123456', password: 'Secreta1!' }],
    ['resendVerification', () => auth.resendVerification('a@x.com'), '/auth/resend-verification', { email: 'a@x.com' }],
    ['forgotPassword', () => auth.forgotPassword('a@x.com'), '/auth/forgot-password', { email: 'a@x.com' }],
    ['verifyResetCode', () => auth.verifyResetCode('a@x.com', '123456'), '/auth/verify-code', { email: 'a@x.com', code: '123456' }],
    ['resetPassword', () => auth.resetPassword('a@x.com', '123456', 'Nueva1!x'), '/auth/reset-password', { email: 'a@x.com', code: '123456', newPassword: 'Nueva1!x' }],
    ['changePassword', () => auth.changePassword('Vieja1!x', 'Nueva1!x'), '/users/me/password', { currentPassword: 'Vieja1!x', newPassword: 'Nueva1!x' }],
  ])('%s', async (_name, call, path, body) => {
    post.mockResolvedValueOnce({});
    await expect(call()).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith(path, body);
  });

  it('sendDeletionCode no manda cuerpo', async () => {
    post.mockResolvedValueOnce({});
    await auth.sendDeletionCode();
    expect(post).toHaveBeenCalledWith('/users/me/delete-code');
  });

  it('deleteAccount confirma con contraseña o con codigo en el cuerpo del DELETE', async () => {
    del.mockResolvedValue({});
    await auth.deleteAccount({ password: 'Secreta1!' });
    expect(del).toHaveBeenLastCalledWith('/users/me', { data: { password: 'Secreta1!' } });
    await auth.deleteAccount({ code: '123456' });
    expect(del).toHaveBeenLastCalledWith('/users/me', { data: { code: '123456' } });
  });

  it('los errores del servidor llegan sin cambios a quien llama', async () => {
    const error = Object.assign(new Error('HTTP 403'), { response: { status: 403, data: { code: 'INVALID_PASSWORD' } } });
    post.mockRejectedValueOnce(error);
    await expect(auth.changePassword('mala', 'Nueva1!x')).rejects.toBe(error);
  });
});
