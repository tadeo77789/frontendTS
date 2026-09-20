import { Clipboard } from 'react-native';

/**
 * Copia texto al portapapeles. Devuelve false cuando el texto esta vacio o la
 * plataforma no deja escribir, para que quien llame muestre el aviso correcto.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  const value = text.trim();
  if (!value) return false;
  try {
    Clipboard.setString(value);
    return true;
  } catch {
    return false;
  }
};
