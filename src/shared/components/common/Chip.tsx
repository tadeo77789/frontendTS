
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';

interface ChipProps {
  label: string;
  active?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({ label, active, icon, onPress, style }) => {
  const C = useColors();
  const fg = active ? C.primary : C.textSecondary;
  const bg = active ? C.primaryBg : C.surface;
  const borderColor = active ? C.primary : C.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[styles.chip, { backgroundColor: bg, borderColor }, style]}
    >
      {icon && <Ionicons name={icon} size={13} color={fg} />}
      <Text style={[styles.text, { color: fg, fontWeight: active ? '700' : '500' }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  text: {
    fontSize: 13,
  },
});
