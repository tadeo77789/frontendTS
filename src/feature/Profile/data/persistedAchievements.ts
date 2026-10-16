export type PersistedAchievementMetric =
  | 'TRANSLATIONS_COMPLETED'
  | 'SIGNS_LEARNED'
  | 'ALPHABET_COMPLETED'
  | 'SESSIONS_COMPLETED';

export interface PersistedAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  metric: PersistedAchievementMetric;
  targetCount: number;
  points: number;
  iconReference?: string;
  isSecret: boolean;
  isActive: boolean;
}

export interface PersistedAchievementProgress {
  achievement: PersistedAchievement;
  currentCount: number;
  achievedAt: string | null;
}

export class InvalidAchievementsResponseError extends Error {
  constructor() {
    super('La respuesta de logros no cumple el contrato');
    this.name = 'InvalidAchievementsResponseError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMetric = (value: unknown): value is PersistedAchievementMetric =>
  value === 'TRANSLATIONS_COMPLETED'
  || value === 'SIGNS_LEARNED'
  || value === 'ALPHABET_COMPLETED'
  || value === 'SESSIONS_COMPLETED';

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

// Profile serializa achievedAt como ISO UTC con milisegundos.
const isAchievedAt = (value: unknown): value is string | null => {
  if (value === null) return true;
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    && new Date(timestamp).toISOString() === value;
};

const isAchievement = (value: unknown): value is PersistedAchievement =>
  isRecord(value)
  && typeof value.id === 'string' && value.id.trim().length > 0
  && typeof value.code === 'string' && value.code.trim().length > 0
  && typeof value.name === 'string'
  && typeof value.description === 'string'
  && isMetric(value.metric)
  && isNonNegativeInteger(value.targetCount) && value.targetCount > 0
  && typeof value.points === 'number' && Number.isSafeInteger(value.points)
  && (value.iconReference === undefined || typeof value.iconReference === 'string')
  && typeof value.isSecret === 'boolean'
  && typeof value.isActive === 'boolean';

const isProgress = (value: unknown): value is PersistedAchievementProgress =>
  isRecord(value)
  && isAchievement(value.achievement)
  && isNonNegativeInteger(value.currentCount)
  && isAchievedAt(value.achievedAt);

/** Valida el sobre completo; un elemento invalido no se convierte en progreso cero. */
export const parseAchievementsResponse = (
  value: unknown,
): PersistedAchievementProgress[] => {
  if (
    !isRecord(value)
    || !Array.isArray(value.data)
    || !value.data.every(isProgress)
  ) {
    throw new InvalidAchievementsResponseError();
  }

  const ids = new Set(value.data.map(progress => progress.achievement.id));
  if (ids.size !== value.data.length) {
    throw new InvalidAchievementsResponseError();
  }

  return value.data;
};

/** La fecha persistida determina el desbloqueo, nunca el contador. */
export const persistedProgressOf = (
  progress: PersistedAchievementProgress,
): { unlocked: boolean; percent: number } => {
  const { currentCount, achievedAt, achievement } = progress;
  const validTarget =
    isNonNegativeInteger(achievement.targetCount)
    && achievement.targetCount > 0;
  const percent = validTarget && isNonNegativeInteger(currentCount)
    ? Math.min(100, Math.round((currentCount / achievement.targetCount) * 100))
    : 0;

  return { unlocked: achievedAt !== null, percent };
};

/** Un catalogo vacio tiene cero progreso, sin dividir entre cero. */
export const persistedCatalogProgress = (
  achievements: readonly PersistedAchievementProgress[],
): { unlocked: number; total: number; percent: number } => {
  const unlocked = achievements.filter(
    progress => progress.achievedAt !== null,
  ).length;
  const total = achievements.length;

  return {
    unlocked,
    total,
    percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  };
};