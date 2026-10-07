// Estado del paso "confirmar correo". Solo en memoria del módulo: nunca se persiste,
// ni se pasa por params de navegación ni se registra en logs.
export const RESEND_COOLDOWN_MS = 60_000;
const MAX_AGE_MS = 30 * 60_000;

export interface PendingAuthFlow {
  mode: 'verify';
  email: string;
  password?: string;
  resendAvailableAt?: number;
  createdAt?: number;
}

let pending: PendingAuthFlow | null = null;

export const pendingAuthFlow = {
  set: (value: PendingAuthFlow): void => {
    pending = { ...value, createdAt: Date.now() };
  },
  // Caduca a los 30 min: devuelve null y limpia (la contraseña no se queda en memoria).
  get: (): PendingAuthFlow | null => {
    if (pending && Date.now() - (pending.createdAt ?? 0) > MAX_AGE_MS) pending = null;
    return pending;
  },
  update: (patch: Partial<PendingAuthFlow>): void => {
    if (pending) pending = { ...pending, ...patch };
  },
  clear: (): void => {
    pending = null;
  },
};
