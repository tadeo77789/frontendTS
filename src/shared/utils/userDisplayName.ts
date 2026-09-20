import type { User } from '../types';

/**
 * Nombre visible de la cuenta: el que la persona escribio al registrarse y, solo
 * si la sesion no lo trae, el trozo del correo anterior a la arroba.
 */
export const userDisplayName = (user: User | null | undefined): string => {
  const name = user?.nombre?.trim();
  if (name) return name;
  const handle = user?.email?.split('@')[0]?.trim();
  return handle || 'Usuario';
};
