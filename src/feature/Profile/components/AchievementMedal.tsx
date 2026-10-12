import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import {
  persistedProgressOf,
  type PersistedAchievementProgress,
} from '../data/persistedAchievements';

interface AchievementMedalProps {
  achievement: PersistedAchievementProgress;
  size: number;
}

/** Medalla neutral: no asigna niveles ni interpreta iconReference como Ionicon. */
export const AchievementMedal: React.FC<AchievementMedalProps> = ({ achievement, size }) => {
  const C = useColors();
  const { unlocked } = persistedProgressOf(achievement);

  return (
    <View
      style={[
        styles.medal,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: unlocked ? C.primaryBg : C.inputBg,
          borderColor: unlocked ? C.borderInput : C.border,
        },
      ]}
    >
      <Ionicons
        name={unlocked ? 'ribbon' : 'ribbon-outline'}
        size={size * 0.46}
        color={unlocked ? C.primary : C.textHint}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});