import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { TranslationKey } from '../../../app/config/i18n';
import type { useColors } from '../../../app/providers/ThemeContext';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];
export type AppColors = ReturnType<typeof useColors>;

export type AchievementCategory = 'translation' | 'vocabulary' | 'consistency';

export type AchievementLevel = 'bronze' | 'silver' | 'gold';

/** Estadisticas reales del usuario (GET /translations/me/stats). */
export interface MyStats {
  totalTranslations: number;
  distinctWords: number;
  activeDays: number;
  currentStreakDays: number;
  longestStreakDays: number;
}

/** Cada logro mide una de estas cifras del backend. */
export type AchievementMetric = 'totalTranslations' | 'distinctWords' | 'longestStreakDays';

interface AchievementDef {
  id: string;
  category: AchievementCategory;
  level: AchievementLevel;
  /** Nombre del icono relleno; bloqueado usa la variante -outline. */
  icon: IoniconName;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  metric: AchievementMetric;
  target: number;
}

export interface Achievement extends AchievementDef {
  /** Avance real: valor de la metrica en las estadisticas (0 si aun no cargan). */
  value: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstSign',     category: 'translation', level: 'bronze', icon: 'hand-left',  nameKey: 'achFirstSignName',     descKey: 'achFirstSignDesc',     metric: 'totalTranslations', target: 1 },
  { id: 'hundredSigns',  category: 'translation', level: 'silver', icon: 'hand-right', nameKey: 'achHundredSignsName',  descKey: 'achHundredSignsDesc',  metric: 'totalTranslations', target: 100 },
  { id: 'thousandSigns', category: 'translation', level: 'gold',   icon: 'trophy',     nameKey: 'achThousandSignsName', descKey: 'achThousandSignsDesc', metric: 'totalTranslations', target: 1000 },

  { id: 'firstTen',   category: 'vocabulary', level: 'bronze', icon: 'bookmark', nameKey: 'achFirstTenName',   descKey: 'achFirstTenDesc',   metric: 'distinctWords', target: 10 },
  { id: 'twoHundred', category: 'vocabulary', level: 'gold',   icon: 'book',     nameKey: 'achTwoHundredName', descKey: 'achTwoHundredDesc', metric: 'distinctWords', target: 200 },

  { id: 'sevenDays',  category: 'consistency', level: 'bronze', icon: 'calendar', nameKey: 'achSevenDaysName',  descKey: 'achSevenDaysDesc',  metric: 'longestStreakDays', target: 7 },
  { id: 'thirtyDays', category: 'consistency', level: 'gold',   icon: 'flame',    nameKey: 'achThirtyDaysName', descKey: 'achThirtyDaysDesc', metric: 'longestStreakDays', target: 30 },
];

/** Aplica las estadisticas a la lista; sin estadisticas todo queda en 0. */
export const buildAchievements = (stats: MyStats | null): Achievement[] =>
  ACHIEVEMENTS.map(def => ({ ...def, value: stats ? stats[def.metric] : 0 }));

export const CATEGORY_LABEL_KEYS: Record<AchievementCategory, TranslationKey> = {
  translation: 'achievementsCatTranslation',
  vocabulary:  'achievementsCatVocabulary',
  consistency: 'achievementsCatConsistency',
};

export const LEVEL_LABEL_KEYS: Record<AchievementLevel, TranslationKey> = {
  bronze: 'achievementLevelBronze',
  silver: 'achievementLevelSilver',
  gold:   'achievementLevelGold',
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  'translation',
  'vocabulary',
  'consistency',
];

export interface AchievementProgress {
  unlocked: boolean;
  /** Porcentaje ya acotado a 0-100 para poder usarlo como ancho de barra. */
  percent: number;
}

export const progressOf = (achievement: Achievement): AchievementProgress => {
  const { value, target } = achievement;
  return {
    unlocked: value >= target,
    percent: Math.min(100, Math.round((value / target) * 100)),
  };
};

export const countUnlocked = (achievements: Achievement[]): number =>
  achievements.filter(achievement => progressOf(achievement).unlocked).length;

export const iconNameFor = (achievement: Achievement, unlocked: boolean): IoniconName =>
  unlocked ? achievement.icon : (`${achievement.icon}-outline` as IoniconName);

export interface MedalPalette {
  background: string;
  border: string;
  icon: string;
  /** Solo el oro desbloqueado proyecta halo; el resto lo deja en transparente. */
  glow: string;
}

/**
 * Los tres niveles se construyen con el acento activo (morado o verde) en lugar
 * de colores fijos de medalla, para que la tarjeta siga al tema elegido. El oro
 * invierte su fondo en oscuro: primaryDark es el tono claro de la escala ahi y
 * dejaria el icono blanco ilegible.
 */
export const medalPalette = (
  level: AchievementLevel,
  unlocked: boolean,
  C: AppColors,
  isDark: boolean
): MedalPalette => {
  if (!unlocked) {
    return { background: C.inputBg, border: C.border, icon: C.textHint, glow: 'transparent' };
  }
  switch (level) {
    case 'gold':
      return {
        background: isDark ? C.primaryLighter : C.primaryDark,
        border: isDark ? C.primary : C.primaryDark,
        icon: '#FFFFFF',
        glow: C.primary,
      };
    case 'silver':
      return { background: C.primaryBg, border: C.primaryLight, icon: C.primaryDark, glow: 'transparent' };
    default:
      return { background: C.inputBg, border: C.borderInput, icon: C.primaryDark, glow: 'transparent' };
  }
};
