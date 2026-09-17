import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useColors } from '../../../app/providers/ThemeContext';
import { iconNameFor, medalPalette, progressOf, type Achievement } from '../data/achievements';

interface AchievementMedalProps {
  achievement: Achievement;
  size: number;
}

/** Circulo de medalla compartido por la rejilla y el detalle; solo cambia el tamano. */
export const AchievementMedal: React.FC<AchievementMedalProps> = ({ achievement, size }) => {
  const { isDark } = useTheme();
  const C = useColors();
  const { unlocked } = progressOf(achievement);
  const palette = medalPalette(achievement.level, unlocked, C, isDark);

  return (
    <View
      style={[
        styles.medal,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.background,
          borderColor: palette.border,
          shadowColor: palette.glow,
          shadowOpacity: palette.glow === 'transparent' ? 0 : 0.45,
          elevation: palette.glow === 'transparent' ? 0 : 6,
        },
      ]}
    >
      <Ionicons name={iconNameFor(achievement, unlocked)} size={size * 0.46} color={palette.icon} />
    </View>
  );
};

const styles = StyleSheet.create({
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
});
