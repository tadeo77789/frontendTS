
// Validacion de correo compartida por los formularios de autenticacion.
// El patron exige usuario@dominio.tld (TLD de 2+ letras), de modo que un simple
// nombre de usuario ("carlos") o un dominio sin extension ("carlos@gmail") no pasan.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export type EmailIssue = 'required' | 'notEmail' | 'invalid';

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => EMAIL_RE.test(value.trim());

// Devuelve el tipo de problema del valor, o undefined si es un correo valido.
// 'notEmail' es el caso en el que el usuario escribio un nombre de usuario
// (texto sin arroba) en lugar de un correo electronico.
export function checkEmail(value: string): EmailIssue | undefined {
  const v = value.trim();
  if (!v) return 'required';
  if (!v.includes('@')) return 'notEmail';
  return EMAIL_RE.test(v) ? undefined : 'invalid';
}
