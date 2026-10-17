import es from '../../../app/config/i18n/locales/es';
import en from '../../../app/config/i18n/locales/en';
import fr from '../../../app/config/i18n/locales/fr';
import pt from '../../../app/config/i18n/locales/pt';
import { parseAchievementsResponse, persistedCatalogProgress, persistedProgressOf, InvalidAchievementsResponseError } from '../data/persistedAchievements';
import { catalogue, legacy } from './fixtures';

describe('catalogue contract', () => {
  it.each([
    [es, "Este logro estará disponible en una próxima actualización."],
    [en, "This achievement will be available in a future update."],
    [fr, "Ce succès sera disponible dans une prochaine mise à jour."],
    [pt, "Esta conquista estará disponível em uma próxima atualização."],
  ])('uses simple upcoming fallback copy in each language', (locale, message) => {
    expect((locale as typeof es).achievementUnavailableReason).toBe(message);
  });
  it('has 24 unique upcoming entries, no numeric progress and separate legacy totals', () => {
    const items = catalogue();
    expect(items).toHaveLength(24);
    expect(new Set(items.map(p => p.achievement.code)).size).toBe(24);
    expect(items.every(p => p.currentCount === null && p.achievement.targetCount === null)).toBe(true);
    expect(items.every(p => persistedProgressOf(p).percent === null)).toBe(true);
    const old = legacy(); old.currentCount = 1; old.achievedAt = '2026-01-01T00:00:00.000Z';
    expect(persistedCatalogProgress([...items, old, legacy('TEN_TRANSLATIONS', 10), legacy('FIFTY_TRANSLATIONS', 50)]))
      .toEqual({ total: 24, available: 0, upcoming: 24, unlocked: 0, percent: null, legacyTotal: 3, legacyUnlocked: 1 });
  });
  it('uses achievedAt, not target attainment, as unlock authority', () => {
    const old = legacy(); old.currentCount = 1;
    expect(persistedProgressOf(old)).toEqual({ unlocked: false, percent: 100 });
    old.achievedAt = '2026-01-01T00:00:00.000Z';
    expect(persistedProgressOf(old).unlocked).toBe(true);
  });
  it('accepts old measured responses for frontend-first deployment', () => {
    const { collection, availability, category, level, localizations, ...achievement } = legacy('TEN_TRANSLATIONS',10).achievement;
    expect(parseAchievementsResponse({ data: [{ achievement, currentCount: 7, achievedAt: null }] })[0])
      .toMatchObject({ achievement: { collection: 'legacy', availability: 'available', targetCount: 10 }, currentCount: 7 });
  });
  it.each(['currentCount','achievedAt','targetCount'])('rejects fictitious upcoming %s', field => {
    const p = catalogue()[0];
    if (field === 'currentCount') p.currentCount = 0;
    if (field === 'achievedAt') p.achievedAt = '2026-01-01T00:00:00.000Z';
    if (field === 'targetCount') p.achievement.targetCount = 1;
    expect(() => parseAchievementsResponse({ data: [p] })).toThrow(InvalidAchievementsResponseError);
  });
  it('rejects duplicates and partially specified availability metadata', () => {
    const p = catalogue()[0];
    expect(() => parseAchievementsResponse({ data: [p,p] })).toThrow();
    const invalid = { ...p.achievement } as Record<string, unknown>; delete invalid.availability;
    expect(() => parseAchievementsResponse({ data: [{ ...p, achievement: invalid }] })).toThrow();
  });
  it('does not divide by an empty measurable catalogue', () => {
    expect(persistedCatalogProgress([]).percent).toBeNull();
  });
});
