import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';

/** Confirma el correo con el código de 6 dígitos. Lanza el error de axios (usar normalizeApiError). */
export const verifyEmail = async (email: string, code: string, password: string): Promise<void> => {
  await api.post(ENDPOINTS.verifyEmail, { email, code, password });
};

/** Pide un código nuevo. El servidor responde siempre 200, no se lee su mensaje. */
export const resendVerification = async (email: string): Promise<void> => {
  await api.post(ENDPOINTS.resendVerification, { email });
};

/** Pide el código de recuperación. El servidor responde igual exista o no la cuenta. */
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post(ENDPOINTS.forgotPassword, { email });
};

/** Comprueba el código de recuperación (no lo consume). */
export const verifyResetCode = async (email: string, code: string): Promise<void> => {
  await api.post(ENDPOINTS.verifyCode, { email, code });
};

/** Cambia la contraseña con el código de recuperación. */
export const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
  await api.post(ENDPOINTS.resetPassword, { email, code, newPassword });
};

/** Cambia la contraseña de la cuenta con sesión iniciada. 403 INVALID_PASSWORD si la actual es incorrecta. */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await api.post(ENDPOINTS.mePassword, { currentPassword, newPassword });
};

/** Elimina la cuenta y sus datos. 403 INVALID_PASSWORD, 409 LAST_ADMIN. */
export const deleteAccount = async (password: string): Promise<void> => {
  await api.delete(ENDPOINTS.me, { data: { password } });
};
