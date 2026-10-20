import es from '../../../app/config/i18n/locales/es';
import en from '../../../app/config/i18n/locales/en';
import fr from '../../../app/config/i18n/locales/fr';
import pt from '../../../app/config/i18n/locales/pt';
import { parseAchievementsResponse, type PersistedAchievementProgress } from '../data/persistedAchievements';
export const legacy = (code = 'FIRST_TRANSLATION', target = 1): PersistedAchievementProgress => ({
  achievement: { id: code, code, name: code, description: code, metric: 'TRANSLATIONS_COMPLETED', targetCount: target,
    points: 10, isSecret: false, isActive: true, collection: 'legacy', availability: 'available', category: null, level: null, localizations: {} },
  currentCount: 0, achievedAt: null,
});
const metadata = [["firstSign", "translation", "bronze", "hand-left"], ["hundredSigns", "translation", "silver", "hand-right"], ["thousandSigns", "translation", "gold", "trophy"], ["fullConversation", "translation", "silver", "chatbubbles"], ["voiceOn", "translation", "bronze", "volume-high"], ["twoWay", "translation", "silver", "swap-horizontal"], ["offline", "translation", "bronze", "cloud-offline"], ["firstPractice", "practice", "bronze", "videocam"], ["steadyHand", "practice", "silver", "locate"], ["perfectPulse", "practice", "gold", "scan-circle"], ["sprinter", "practice", "silver", "flash"], ["fingerspelling", "practice", "silver", "text"], ["honestReview", "practice", "bronze", "refresh"], ["facialExpression", "practice", "gold", "happy"], ["firstTen", "vocabulary", "bronze", "bookmark"], ["twoHundred", "vocabulary", "gold", "book"], ["everyday", "vocabulary", "silver", "home"], ["numbersHours", "vocabulary", "bronze", "time"], ["regionalisms", "vocabulary", "silver", "location"], ["sevenDays", "consistency", "bronze", "calendar"], ["thirtyDays", "consistency", "gold", "flame"], ["beforeDawn", "consistency", "silver", "partly-sunny"], ["sharedSign", "community", "bronze", "share-social"], ["bridge", "community", "gold", "people"]] as const;
export const catalogue = (): PersistedAchievementProgress[] => parseAchievementsResponse({ data: metadata.map(([code, category, level, iconReference]) => ({
  achievement: { ...legacy().achievement, id: code, code, name: code, description: `Requirement: ${code}`,
    metric: 'CATALOG_REQUIREMENT', targetCount: null, collection: 'catalog', availability: 'upcoming', category, level, iconReference,
    localizations: { es: { name: code, description: `Requirement: ${code}`, unavailableReason: 'Este logro estará disponible en una próxima actualización.' } } },
  currentCount: null, achievedAt: null,
})) });

/** Actual server catalogue after 006; the 24-entry fixture above models the old server only. */
export const translationMilestones = (): PersistedAchievementProgress[] => [
  legacy(), legacy('TEN_TRANSLATIONS',10), legacy('FIFTY_TRANSLATIONS',50),
  ...(['hundredSigns','thousandSigns'] as const).map((code,index) => {
    const localizations = Object.fromEntries(Object.entries({es,en,fr,pt}).map(([language,locale]) => [language, {
      name: index === 0 ? locale.achHundredSignsName : locale.achThousandSignsName,
      description: index === 0 ? locale.achHundredSignsDesc : locale.achThousandSignsDesc,
    }]));
    return { ...legacy(code,index === 0 ? 100 : 1000), achievement: {
      ...legacy(code,index === 0 ? 100 : 1000).achievement,
      name: localizations.es.name, description: localizations.es.description,
      collection: 'catalog' as const, category: 'translation' as const,
      level: index === 0 ? 'silver' as const : 'gold' as const, points: 0, localizations,
    } };
  }),
];
