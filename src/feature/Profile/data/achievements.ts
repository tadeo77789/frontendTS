import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { TranslationKey } from '../../../app/config/i18n';
import type { useColors } from '../../../app/providers/ThemeContext';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];
export type AppColors = ReturnType<typeof useColors>;

export type AchievementCategory =
  | 'translation'
  | 'practice'
  | 'vocabulary'
  | 'consistency'
  | 'community';

export type AchievementLevel = 'bronze' | 'silver' | 'gold';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  level: AchievementLevel;
  /** Nombre del icono relleno; bloqueado usa la variante -outline. */
  icon: IoniconName;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  value: number;
  target: number;
  /** Solo 'percent' cambia el formato del progreso; el resto se muestra valor/meta. */
  unit?: 'percent';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstSign',        category: 'translation', level: 'bronze', icon: 'hand-left',       nameKey: 'achFirstSignName',        descKey: 'achFirstSignDesc',        value: 1,    target: 1 },
  { id: 'hundredSigns',     category: 'translation', level: 'silver', icon: 'hand-right',      nameKey: 'achHundredSignsName',     descKey: 'achHundredSignsDesc',     value: 100,  target: 100 },
  { id: 'thousandSigns',    category: 'translation', level: 'gold',   icon: 'trophy',          nameKey: 'achThousandSignsName',    descKey: 'achThousandSignsDesc',    value: 412,  target: 1000 },
  { id: 'fullConversation', category: 'translation', level: 'silver', icon: 'chatbubbles',     nameKey: 'achFullConversationName', descKey: 'achFullConversationDesc', value: 1,    target: 1 },
  { id: 'voiceOn',          category: 'translation', level: 'bronze', icon: 'volume-high',     nameKey: 'achVoiceOnName',          descKey: 'achVoiceOnDesc',          value: 25,   target: 25 },
  { id: 'twoWay',           category: 'translation', level: 'silver', icon: 'swap-horizontal', nameKey: 'achTwoWayName',           descKey: 'achTwoWayDesc',           value: 0,    target: 1 },
  { id: 'offline',          category: 'translation', level: 'bronze', icon: 'cloud-offline',   nameKey: 'achOfflineName',          descKey: 'achOfflineDesc',          value: 0,    target: 1 },

  { id: 'firstPractice',    category: 'practice', level: 'bronze', icon: 'videocam',    nameKey: 'achFirstPracticeName',    descKey: 'achFirstPracticeDesc',    value: 1,  target: 1 },
  { id: 'steadyHand',       category: 'practice', level: 'silver', icon: 'locate',      nameKey: 'achSteadyHandName',       descKey: 'achSteadyHandDesc',       value: 86, target: 90, unit: 'percent' },
  { id: 'perfectPulse',     category: 'practice', level: 'gold',   icon: 'scan-circle', nameKey: 'achPerfectPulseName',     descKey: 'achPerfectPulseDesc',     value: 13, target: 20 },
  { id: 'sprinter',         category: 'practice', level: 'silver', icon: 'flash',       nameKey: 'achSprinterName',         descKey: 'achSprinterDesc',         value: 30, target: 30 },
  { id: 'fingerspelling',   category: 'practice', level: 'silver', icon: 'text',        nameKey: 'achFingerspellingName',   descKey: 'achFingerspellingDesc',   value: 27, target: 27 },
  { id: 'honestReview',     category: 'practice', level: 'bronze', icon: 'refresh',     nameKey: 'achHonestReviewName',     descKey: 'achHonestReviewDesc',     value: 31, target: 50 },
  { id: 'facialExpression', category: 'practice', level: 'gold',   icon: 'happy',       nameKey: 'achFacialExpressionName', descKey: 'achFacialExpressionDesc', value: 0,  target: 1 },

  { id: 'firstTen',     category: 'vocabulary', level: 'bronze', icon: 'bookmark', nameKey: 'achFirstTenName',     descKey: 'achFirstTenDesc',     value: 10,  target: 10 },
  { id: 'twoHundred',   category: 'vocabulary', level: 'gold',   icon: 'book',     nameKey: 'achTwoHundredName',   descKey: 'achTwoHundredDesc',   value: 148, target: 200 },
  { id: 'everyday',     category: 'vocabulary', level: 'silver', icon: 'home',     nameKey: 'achEverydayName',     descKey: 'achEverydayDesc',     value: 40,  target: 40 },
  { id: 'numbersHours', category: 'vocabulary', level: 'bronze', icon: 'time',     nameKey: 'achNumbersHoursName', descKey: 'achNumbersHoursDesc', value: 32,  target: 32 },
  { id: 'regionalisms', category: 'vocabulary', level: 'silver', icon: 'location', nameKey: 'achRegionalismsName', descKey: 'achRegionalismsDesc', value: 4,   target: 15 },

  { id: 'sevenDays',  category: 'consistency', level: 'bronze', icon: 'calendar',     nameKey: 'achSevenDaysName',  descKey: 'achSevenDaysDesc',  value: 7,  target: 7 },
  { id: 'thirtyDays', category: 'consistency', level: 'gold',   icon: 'flame',        nameKey: 'achThirtyDaysName', descKey: 'achThirtyDaysDesc', value: 18, target: 30 },
  { id: 'beforeDawn', category: 'consistency', level: 'silver', icon: 'partly-sunny', nameKey: 'achBeforeDawnName', descKey: 'achBeforeDawnDesc', value: 10, target: 10 },

  { id: 'sharedSign', category: 'community', level: 'bronze', icon: 'share-social', nameKey: 'achSharedSignName', descKey: 'achSharedSignDesc', value: 3, target: 1 },
  { id: 'bridge',     category: 'community', level: 'gold',   icon: 'people',       nameKey: 'achBridgeName',     descKey: 'achBridgeDesc',     value: 6, target: 20 },
];

export const CATEGORY_LABEL_KEYS: Record<AchievementCategory, TranslationKey> = {
  translation: 'achievementsCatTranslation',
  practice:    'achievementsCatPractice',
  vocabulary:  'achievementsCatVocabulary',
  consistency: 'achievementsCatConsistency',
  community:   'achievementsCatCommunity',
};

export const LEVEL_LABEL_KEYS: Record<AchievementLevel, TranslationKey> = {
  bronze: 'achievementLevelBronze',
  silver: 'achievementLevelSilver',
  gold:   'achievementLevelGold',
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  'translation',
  'practice',
  'vocabulary',
  'consistency',
  'community',
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

export const countUnlocked = (): number =>
  ACHIEVEMENTS.filter(achievement => progressOf(achievement).unlocked).length;

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
