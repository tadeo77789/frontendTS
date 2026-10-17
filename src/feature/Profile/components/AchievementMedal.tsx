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

const knownIcons = new Set(['hand-left','hand-right','trophy','chatbubbles','volume-high','swap-horizontal','cloud-offline','videocam','locate','scan-circle','flash','text','refresh','happy','bookmark','book','home','time','location','calendar','flame','partly-sunny','share-social','people']);

/** Only catalogued Ionicons are accepted; never load arbitrary server resources. */
export const AchievementMedal: React.FC<AchievementMedalProps> = ({ achievement, size }) => {
  const C = useColors();
  const { unlocked } = persistedProgressOf(achievement);

  const icon = knownIcons.has(achievement.achievement.iconReference ?? '') ? achievement.achievement.iconReference! : 'ribbon';
  return (
    <View
      testID={`achievement-medal-${achievement.achievement.id}`}
      style={[
        styles.medal,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: unlocked ? C.primaryBg : C.inputBg,
          borderColor: unlocked ? C.primary : C.border,
        },
      ]}
    >
      <Ionicons
        name={(unlocked ? icon : `${icon}-outline`) as React.ComponentProps<typeof Ionicons>['name']}
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