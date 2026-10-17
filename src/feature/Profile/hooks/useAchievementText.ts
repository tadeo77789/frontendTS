import { useTranslation } from '../../../app/config/i18n';
import { persistedProgressOf, type PersistedAchievementProgress } from '../data/persistedAchievements';

export const useAchievementText = () => {
  const { t, language } = useTranslation();
  const textOf = (p: PersistedAchievementProgress) => {
    // Never reveal server-concealed secret text via a localization.
    const localized = p.achievement.isSecret && p.achievedAt === null ? undefined
      : p.achievement.localizations[language] ?? p.achievement.localizations.es;
    return { name: localized?.name ?? p.achievement.name,
      description: localized?.description ?? p.achievement.description,
      unavailableReason: localized?.unavailableReason ?? t('achievementUnavailableReason') };
  };
  const stateText = (p: PersistedAchievementProgress): string =>
    p.achievement.availability === 'upcoming' ? t('achievementUpcoming')
      : persistedProgressOf(p).unlocked ? t('achievementCompleted') : t('achievementPending');
  const progressText = (p: PersistedAchievementProgress): string => {
    if (p.achievement.availability === 'upcoming') return t('achievementUpcoming');
    const target = p.achievement.targetCount;
    if (target === null || p.currentCount === null) return '—';
    return target === 1 ? stateText(p) : `${Math.min(p.currentCount, target)}/${target}`;
  };
  return { textOf, progressText, stateText };
};
