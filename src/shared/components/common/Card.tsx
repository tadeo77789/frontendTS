
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useColors } from '../../../app/providers/ThemeContext';

type Variant = 'flat' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'elevated', style }) => {
  const C = useColors();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: C.surface, borderColor: C.border },
        variant === 'elevated' && styles.elevated,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    padding: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  flat: {
    borderWidth: 1,
  },
});
