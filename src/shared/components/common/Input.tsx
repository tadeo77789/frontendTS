

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { useColors } from '../../../app/providers/ThemeContext';
import { BorderRadius, BorderWidth, ComponentSizes, FontWeight, TextStyles } from '../../../shared/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
}

function InputBase({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  containerStyle,
  size = 'md',
  accentColor,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const C = useColors();
  const accent = accentColor ?? C.primary;
  const sizeTokens = ComponentSizes.input[size];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>}
      <View style={styles.fieldRow}>
        {leftIcon && (
          <View
            style={[
              styles.leftIconBox,
              { height: sizeTokens.height, width: sizeTokens.height, backgroundColor: C.inputBg },
              focused && [styles.leftIconBoxFocused, { backgroundColor: C.surface, borderColor: accent, shadowColor: accent }],
              error ? styles.leftIconBoxError : null,
            ]}
          >
            <Ionicons
              name={leftIcon}
              size={20}
              color={focused ? accent : C.textSecondary}
            />
          </View>
        )}
        <View
          style={[
            styles.inputWrapper,
            { height: sizeTokens.height, backgroundColor: C.inputBg },
            { flex: 1 },
            leftIcon ? styles.inputWrapperAttached : null,
            focused && [styles.inputFocused, { backgroundColor: C.surface, borderColor: accent, shadowColor: accent }],
            error ? styles.inputError : null,
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { paddingHorizontal: sizeTokens.paddingHorizontal, color: C.textPrimary },
              (isPassword || rightIcon) ? styles.inputWithRight : null,
            ]}
            placeholderTextColor={C.textHint}
            secureTextEntry={isPassword && !showPassword}
            autoCapitalize="none"
            textAlignVertical="center"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {isPassword && (
            props.editable === false ? (
              <View style={styles.rightIcon} pointerEvents="none">
                <Ionicons name="eye-outline" size={20} color={C.textSecondary} />
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.rightIcon}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={focused ? accent : C.textSecondary}
                />
              </TouchableOpacity>
            )
          )}
          {rightIcon && !isPassword && (
            onRightIconPress ? (
              <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
                <Ionicons name={rightIcon} size={20} color={C.textSecondary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.rightIcon} pointerEvents="none">
                <Ionicons name={rightIcon} size={20} color={C.textSecondary} />
              </View>
            )
          )}
        </View>
      </View>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export const Input = React.memo(InputBase);

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    ...TextStyles.label,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: BorderWidth.medium,
    borderColor: 'transparent',
  },
  leftIconBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  leftIconBoxError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.md,
    borderWidth: BorderWidth.medium,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputWrapperAttached: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputWithRight: {
    paddingRight: 12,
  },
  rightIcon: {
    paddingHorizontal: 12,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...TextStyles.caption,
    color: Colors.textHint,
    marginTop: 4,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.error,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
});
