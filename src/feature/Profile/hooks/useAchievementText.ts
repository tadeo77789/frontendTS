import { useTranslation } from '../../../app/config/i18n';
import { LEVEL_LABEL_KEYS, progressOf, type Achievement } from '../data/achievements';

/** Etiquetas de progreso, nivel y estado, resueltas con el idioma activo. */
export const useAchievementText = () => {
  const { t } = useTranslation();

  // Las metas de un solo paso no tienen contador que mostrar: se leen como
  // completado o pendiente en lugar de "1/1".
  const progressText = (achievement: Achievement): string => {
    const { unlocked } = progressOf(achievement);
    if (achievement.target === 1) return unlocked ? t('achievementCompleted') : t('achievementPending');
    const reached = Math.min(achievement.value, achievement.target);
    return achievement.unit === 'percent'
      ? `${reached}% / ${achievement.target}%`
      : `${reached}/${achievement.target}`;
  };

  const levelText = (achievement: Achievement): string => {
    const { unlocked } = progressOf(achievement);
    return unlocked ? t(LEVEL_LABEL_KEYS[achievement.level]) : t('achievementLocked');
  };

  const stateText = (achievement: Achievement): string =>
    progressOf(achievement).unlocked ? t('achievementUnlocked') : t('achievementInProgress');

  return { progressText, levelText, stateText };
};
