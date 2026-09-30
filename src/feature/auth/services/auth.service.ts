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
