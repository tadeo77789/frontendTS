import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AchievementProgressBarProps {
  percent: number;
  track: string;
  fill: string;
  height?: number;
}

export const AchievementProgressBar: React.FC<AchievementProgressBarProps> = ({
  percent,
  track,
  fill,
  height = 8,
}) => (
  <View style={[styles.track, { height, borderRadius: height, backgroundColor: track }]}>
    <View style={[styles.fill, { width: `${percent}%`, borderRadius: height, backgroundColor: fill }]} />
  </View>
);

const styles = StyleSheet.create({
  track: { flex: 1, overflow: 'hidden' },
  fill: { height: '100%' },
});
