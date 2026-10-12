import { useTranslation } from '../../../app/config/i18n';
import {
  persistedProgressOf,
  type PersistedAchievementProgress,
} from '../data/persistedAchievements';

/** Etiquetas de interfaz; no traduce ni revela los textos del catalogo. */
export const useAchievementText = () => {
  const { t } = useTranslation();

  const progressText = (progress: PersistedAchievementProgress): string => {
    const { unlocked } = persistedProgressOf(progress);
    const { targetCount } = progress.achievement;
    if (
      !Number.isSafeInteger(targetCount) || targetCount <= 0
      || !Number.isSafeInteger(progress.currentCount) || progress.currentCount < 0
    ) {
      return '—';
    }
    if (targetCount === 1) return unlocked ? t('achievementCompleted') : t('achievementPending');
    const reached = Math.min(progress.currentCount, targetCount);
    return `${reached}/${targetCount}`;
  };

  const stateText = (progress: PersistedAchievementProgress): string =>
    persistedProgressOf(progress).unlocked ? t('achievementUnlocked') : t('achievementInProgress');

  return { progressText, stateText };
};
