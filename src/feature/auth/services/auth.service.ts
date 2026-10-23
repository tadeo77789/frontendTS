import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import { TERMS_VERSION } from '../../../app/config/legal.config';
import type { RegisterPayload } from '../../../shared/types';

/**
 * Body de POST /auth/register. El backend rechaza el registro (400) sin acceptedTerms=true;
 * se envia la version de los terminos que vio la persona para dejar constancia del consentimiento.
 */
export const buildRegisterBody = (payload: RegisterPayload) => ({
  name: payload.nombre,
  email: payload.email,
  password: payload.password,
  acceptedTerms: payload.termino_acept,
  termsVersion: TERMS_VERSION,
});

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

/**
 * Elimina la cuenta y sus datos. Con contraseña se confirma con ella (403 INVALID_PASSWORD); las cuentas
 * creadas con Google, con el codigo de sendDeletionCode (400 INVALID_CODE). 409 LAST_ADMIN.
 */
export const deleteAccount = async (confirmation: { password: string } | { code: string }): Promise<void> => {
  await api.delete(ENDPOINTS.me, { data: confirmation });
};

/** Envia al correo el codigo que confirma el borrado de una cuenta sin contraseña. 429 si se pide muy seguido. */
export const sendDeletionCode = async (): Promise<void> => {
  await api.post(ENDPOINTS.meDeleteCode);
};
