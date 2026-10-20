export type PersistedAchievementMetric =
  | 'TRANSLATIONS_COMPLETED' | 'SIGNS_LEARNED' | 'ALPHABET_COMPLETED'
  | 'SESSIONS_COMPLETED' | 'CATALOG_REQUIREMENT';
export const CATEGORIES = ['translation', 'practice', 'vocabulary', 'consistency', 'community'] as const;
export type AchievementCategory = typeof CATEGORIES[number];
export interface AchievementLocalization { name: string; description: string; unavailableReason?: string }
export interface PersistedAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  metric: PersistedAchievementMetric;
  targetCount: number | null;
  points: number;
  iconReference?: string;
  isSecret: boolean;
  isActive: boolean;
  collection: 'catalog' | 'legacy';
  availability: 'available' | 'upcoming';
  category: AchievementCategory | null;
  level: 'bronze' | 'silver' | 'gold' | null;
  localizations: Record<string, AchievementLocalization>;
}
export interface PersistedAchievementProgress {
  achievement: PersistedAchievement;
  currentCount: number | null;
  achievedAt: string | null;
}
export class InvalidAchievementsResponseError extends Error {
  constructor() { super('La respuesta de logros no cumple el contrato'); this.name = 'InvalidAchievementsResponseError'; }
}
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const metrics = ['TRANSLATIONS_COMPLETED', 'SIGNS_LEARNED', 'ALPHABET_COMPLETED', 'SESSIONS_COMPLETED', 'CATALOG_REQUIREMENT'];
const isDate = (v: unknown): boolean => v === null || (typeof v === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)
  && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v);
const isLocalization = (v: unknown) => isRecord(v) && typeof v.name === 'string'
  && typeof v.description === 'string' && (v.unavailableReason === undefined || typeof v.unavailableReason === 'string');

/** Accept the old measured-only response during frontend-first deployment.
 * Explicit but incomplete new metadata is rejected instead of inventing defaults.
 */
export const parseAchievementsResponse = (value: unknown): PersistedAchievementProgress[] => {
  const fail = (): never => { throw new InvalidAchievementsResponseError(); };
  if (!isRecord(value) || !Array.isArray(value.data)) return fail();
  const parsed = value.data.map((entry: unknown): PersistedAchievementProgress => {
    if (!isRecord(entry) || !isRecord(entry.achievement)) return fail();
    const a = entry.achievement;
    const old = ['collection', 'availability', 'category', 'level', 'localizations'].every(key => !(key in a));
    const normalized = old ? { ...a, collection: 'legacy', availability: 'available', category: null, level: null, localizations: {} } : a;
    if (typeof a.id !== 'string' || !a.id.trim() || typeof a.code !== 'string' || !a.code.trim()
      || typeof a.name !== 'string' || typeof a.description !== 'string'
      || typeof a.metric !== 'string' || !metrics.includes(a.metric) || !Number.isSafeInteger(a.points)
      || (a.iconReference !== undefined && typeof a.iconReference !== 'string')
      || typeof a.isSecret !== 'boolean' || typeof a.isActive !== 'boolean'
      || !['catalog','legacy'].includes(String(normalized.collection))
      || !['available','upcoming'].includes(String(normalized.availability))
      || !(normalized.category === null || CATEGORIES.includes(normalized.category as AchievementCategory))
      || !(normalized.level === null || ['bronze','silver','gold'].includes(String(normalized.level)))
      || !isRecord(normalized.localizations) || !Object.values(normalized.localizations).every(isLocalization)
      || !isDate(entry.achievedAt)) return fail();
    if (normalized.collection === 'catalog' && (normalized.category === null || normalized.level === null)) return fail();
    if (normalized.availability === 'upcoming') {
      if (a.targetCount !== null || entry.currentCount !== null || entry.achievedAt !== null
        || normalized.collection !== 'catalog'
        || !Object.values(normalized.localizations).some(v => isRecord(v) && typeof v.unavailableReason === 'string' && v.unavailableReason.trim())) return fail();
    } else if (!isCount(a.targetCount) || a.targetCount === 0 || !isCount(entry.currentCount)
      || a.metric === 'CATALOG_REQUIREMENT') return fail();
    // Validation above establishes the wire types; records begin as unknown JSON.
    return { achievement: normalized as unknown as PersistedAchievement,
      currentCount: entry.currentCount as number | null, achievedAt: entry.achievedAt as string | null };
  });
  if (new Set(parsed.map(p => p.achievement.id)).size !== parsed.length
    || new Set(parsed.map(p => p.achievement.code)).size !== parsed.length) return fail();
  return parsed;
};

/** achievedAt is authoritative; upcoming entries have no numeric progress. */
export const persistedProgressOf = (p: PersistedAchievementProgress): { unlocked: boolean; percent: number | null } => {
  if (p.achievement.availability === 'upcoming') return { unlocked: false, percent: null };
  const target = p.achievement.targetCount;
  const percent = isCount(target) && target > 0 && isCount(p.currentCount)
    ? Math.min(100, Math.round(p.currentCount / target * 100)) : 0;
  return { unlocked: p.achievedAt !== null, percent };
};

/** All server-published available achievements contribute, including historical ones. */
export const persistedCatalogProgress = (items: readonly PersistedAchievementProgress[]) => {
  const available = items.filter(p => p.achievement.isActive && p.achievement.availability === 'available');
  const legacy = items.filter(p => p.achievement.collection === 'legacy');
  const unlocked = available.filter(p => p.achievedAt !== null).length;
  return { unlocked, total: items.length, available: available.length,
    upcoming: items.filter(p => p.achievement.availability === 'upcoming').length,
    percent: available.length ? Math.round(unlocked / available.length * 100) : null,
    legacyTotal: legacy.length, legacyUnlocked: legacy.filter(p => p.achievedAt !== null).length };
};
