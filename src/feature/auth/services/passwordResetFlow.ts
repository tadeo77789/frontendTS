// Estado de "olvidé mi contraseña" (correo y código). Solo en memoria del módulo:
// nunca se persiste, ni se pasa por params de navegación ni se registra en logs.
const MAX_AGE_MS = 30 * 60_000;

export interface PasswordResetFlow {
  email: string;
  code?: string;
  resendAvailableAt?: number;
  createdAt?: number;
}

let current: PasswordResetFlow | null = null;

export const passwordResetFlow = {
  set: (value: PasswordResetFlow): void => {
    current = { ...value, createdAt: Date.now() };
  },
  get: (): PasswordResetFlow | null => {
    if (current && Date.now() - (current.createdAt ?? 0) > MAX_AGE_MS) current = null;
    return current;
  },
  update: (patch: Partial<PasswordResetFlow>): void => {
    if (current) current = { ...current, ...patch };
  },
  clear: (): void => {
    current = null;
  },
};
