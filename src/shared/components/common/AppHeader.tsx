
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useColors } from '../../../app/providers/ThemeContext';
import { BorderRadius, Shadows, Spacing } from '../../../shared/constants/theme';

interface AppHeaderProps {
  showBack?: boolean;
  showProfile?: boolean;
  onBack?: () => void;
  onProfile?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showBack = false,
  showProfile = false,
  onBack,
  onProfile,
}) => {
  const insets = useSafeAreaInsets();
  const C = useColors();
  if (Platform.OS === 'web') return null;

  return (
    <LinearGradient
      colors={C.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, { paddingTop: insets.top + Spacing[3], shadowColor: C.primary }]}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../../assets/images/icono-senas.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>TraduceSeña</Text>
          </View>
        )}
      </View>

      {showProfile && (
        <TouchableOpacity style={styles.profileBtn} onPress={onProfile}>
          <Ionicons name="person-circle-outline" size={34} color="#fff" />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing[3],
    justifyContent: 'space-between',
    ...Shadows.primary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoBox: {
    width: 38,
    height: 38,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  logoImage: { width: 30, height: 30 },
  appName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  backBtn: { padding: 4 },
  profileBtn: { padding: 2 },
});
