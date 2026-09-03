
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../../shared/types';
import { Colors, DarkColors, GreenColors, GreenDarkColors } from '../../shared/constants/colors';

const THEME_STORAGE_KEY  = '@app_theme';
const ACCENT_STORAGE_KEY = '@app_color_accent';

export type ColorAccent = 'purple' | 'green';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colorAccent: ColorAccent;
  toggleTheme: () => void;
  resetTheme: () => void;
  setColorAccent: (accent: ColorAccent) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [colorAccent, setColorAccentState] = useState<ColorAccent>('purple');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_STORAGE_KEY),
      AsyncStorage.getItem(ACCENT_STORAGE_KEY),
    ]).then(([storedTheme, storedAccent]) => {
      if (storedTheme === 'light' || storedTheme === 'dark') setMode(storedTheme);
      if (storedAccent === 'purple' || storedAccent === 'green') setColorAccentState(storedAccent);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(prev => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const resetTheme = useCallback(() => {
    setMode('light');
    AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
  }, []);

  const setColorAccent = useCallback((accent: ColorAccent) => {
    setColorAccentState(accent);
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({ mode, isDark: mode === 'dark', colorAccent, toggleTheme, resetTheme, setColorAccent }),
    [mode, colorAccent, toggleTheme, resetTheme, setColorAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
};

export const useColors = () => {
  const { isDark, colorAccent } = useTheme();
  if (colorAccent === 'green') return isDark ? GreenDarkColors : GreenColors;
  return isDark ? DarkColors : Colors;
};
