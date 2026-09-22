/**
 * Cliente HTTP del modulo de autenticacion.
 *
 * El backend responde `{ success, message, data }` y usa 400 para los errores
 * de negocio (credenciales invalidas, correo repetido), asi que aqui se
 * normaliza el mensaje para que los hooks de formulario lo muestren tal cual.
 */

import { api } from '../../Translation/services/api.service';
import { ENDPOINTS } from '../../../app/config/api.config';

export interface BackendUser {
  user_id: number;
  name: string;
  email: string;
}

export interface LoginData {
  token: string;
  user: BackendUser;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

const messageFrom = (error: unknown, fallback: string): string => {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  return res?.data?.message || fallback;
};

export const authService = {
  async login(email: string, password: string): Promise<LoginData> {
    try {
      const { data } = await api.post<ApiEnvelope<LoginData>>(ENDPOINTS.login, {
        email,
        password,
      });
      if (!data?.data?.token) {
        throw new Error(data?.message || 'Respuesta de login invalida');
      }
      return data.data;
    } catch (error) {
      throw new Error(messageFrom(error, 'No se pudo iniciar sesion'));
    }
  },

  async register(name: string, email: string, password: string): Promise<void> {
    try {
      await api.post<ApiEnvelope<BackendUser>>(ENDPOINTS.register, {
        name,
        email,
        password,
      });
    } catch (error) {
      throw new Error(messageFrom(error, 'No se pudo crear la cuenta'));
    }
  },
};
