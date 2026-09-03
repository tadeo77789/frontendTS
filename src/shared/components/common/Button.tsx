

import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../shared/constants/colors';
import { useColors } from '../../../app/providers/ThemeContext';
import { BorderRadius, ComponentSizes, FontWeight, Shadows } from '../../../shared/constants/theme';
import { HoverShadow, HoverShadowSoft } from '../../../shared/constants/hoverStyles';
import { useHover } from '../../../shared/hooks/useHover';

// Cuanto crece el boton al pasar el cursor por encima (solo web).
const HOVER_SCALE = 1.03;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

function ButtonBase({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeTokens = ComponentSizes.button[size];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { hovered, hoverProps } = useHover();
  const C = useColors();

  const variantColorStyle: Record<string, object> = {
    secondary: { backgroundColor: C.primaryBg, borderColor: C.primaryLighter },
    outline:   { borderColor: C.primary },
    ghost:     {},
    danger:    {},
    primary:   { backgroundColor: C.primary },
  };
  const variantTextColor: Record<string, object> = {
    secondary: { color: C.primary },
    outline:   { color: C.primary },
    ghost:     { color: C.primary },
    primary:   { color: '#fff' },
    danger:    { color: '#fff' },
  };

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: hovered ? HOVER_SCALE : 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [scaleAnim, hovered]);

  // En web: al pasar el cursor el boton se levanta un poco y gana sombra.
  const handleHoverIn = useCallback(() => {
    hoverProps.onHoverIn();
    if (isDisabled) return;
    Animated.spring(scaleAnim, {
      toValue: HOVER_SCALE,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [hoverProps, isDisabled, scaleAnim]);

  const handleHoverOut = useCallback(() => {
    hoverProps.onHoverOut();
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [hoverProps, scaleAnim]);

  const showHover = hovered && !isDisabled;

  if (variant === 'primary') {
    return (
      <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          disabled={isDisabled}
          style={({ pressed }) => [
            isDisabled && styles.disabled,
            pressed && !isDisabled && styles.pressed,
            style,
          ]}
        >
          <LinearGradient
            colors={C.gradientPrimaryDeep}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientBase,
              { height: sizeTokens.height, paddingHorizontal: sizeTokens.paddingHorizontal },
              showHover && HoverShadow,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.text, styles.primaryText, textStyle]}>{title}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          variantColorStyle[variant],
          { height: sizeTokens.height, paddingHorizontal: sizeTokens.paddingHorizontal },
          fullWidth && styles.fullWidth,
          showHover && (variant === 'ghost' ? null : HoverShadowSoft),
          showHover && variant !== 'ghost' && { borderColor: C.primary },
          showHover && variant === 'ghost' && { backgroundColor: C.primaryBg },
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color={C.primary} size="small" />
        ) : (
          <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles], variantTextColor[variant], textStyle]}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const Button = React.memo(ButtonBase);

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBase: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLighter,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  primaryText:   { color: '#fff' },
  secondaryText: { color: Colors.primary },
  dangerText:    { color: '#fff' },
  outlineText:   { color: Colors.primary },
  ghostText:     { color: Colors.primary },
});
