import React from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Image } from 'react-native';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useLanguage, type LanguageCode } from '../../../app/providers/LanguageContext';
import { useAuth } from '../../../app/providers/AuthContext';
import { usePreferences } from '../../../app/providers/PreferencesContext';
import { useAdminMode } from '../../../app/providers/AccessContext';
import { userDisplayName } from '../../../shared/utils/userDisplayName';
import { HoverShadowSoft } from '../../../shared/constants/hoverStyles';
import { LanguageDropdown } from './LanguageDropdown';

export const WebTopBar: React.FC<BottomTabHeaderProps> = ({ navigation, route }) => {
  const currentTab = route.name;
  const C = useColors();
  const { t } = useTranslation();

  // Theme y Language mantienen los valores visuales compartidos con Perfil.
  const { isDark, toggleTheme: toggleLocalTheme } = useTheme();
  const { language, setLanguage: setLocalLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  // El provider coordina el guardado, la sesión y los errores.
  const {
    setTheme: saveTheme, setLanguage: saveLanguage,
    loading: preferencesLoading, saving: preferencesSaving,
    error: preferencesError, retry: retryPreferences,
  } = usePreferences();

  // Bloquea los controles mientras se cargan o guardan preferencias.
  const preferencesDisabled = preferencesLoading || preferencesSaving;

  const userName = userDisplayName(user);
  const { adminMode: admin, canStats, canAdmin, homeRoute } = useAdminMode();

  const TAB_ITEMS: { name: string; label: string; icon: string }[] = admin
    ? [
        ...(canStats ? [{ name: 'Stats', label: t('tabStats'), icon: 'bar-chart' }] : []),
        ...(canAdmin ? [{ name: 'Admin', label: t('tabAdmin'), icon: 'shield' }] : []),
      ]
    : [
        { name: 'Translation', label: t('tabTranslation'), icon: 'language' },
        { name: 'Alphabet',    label: t('tabAlphabet'),    icon: 'hand-left' },
        { name: 'History',     label: t('tabHistory'),     icon: 'time' },
      ];

  const goTo = (name: string) => navigation.navigate(name);

  /** Guarda el tema en el servidor con sesión; para visitantes usa almacenamiento local. */
  const handleThemeChange = (dark: boolean) => {
    if (preferencesDisabled) return;
    if (isAuthenticated) void saveTheme(dark ? 'dark' : 'light');
    else toggleLocalTheme();
  };

  /**
   * PreferencesProvider sincroniza ES/EN y conserva FR/PT localmente por usuario.
   * Las solicitudes nacen de esta acción, no de efectos de carga.
   */
  const handleLanguageChange = (code: LanguageCode) => {
    if (preferencesDisabled) return;
    if (isAuthenticated) void saveLanguage(code);
    else void setLocalLanguage(code);
  };

  return (
    <View style={[styles.bar, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
      <View style={styles.inner}>

        {/* Marca */}
        <TouchableOpacity style={styles.logoRow} onPress={() => goTo(homeRoute)} activeOpacity={0.8}>
          <View style={styles.logoBox}>
            <Image source={require('../../../assets/images/icono-senas.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={[styles.appName, { color: C.textPrimary }]}>TraduceSeña</Text>
        </TouchableOpacity>

        {/* Nav */}
        <View style={styles.links}>
          {TAB_ITEMS.map(tab => {
            const focused = currentTab === tab.name;
            return (
              <Pressable
                key={tab.name}
                style={({ hovered }: any) => [
                  styles.link,
                  focused && { backgroundColor: C.primaryBg, borderColor: C.border },
                  hovered && !focused && { backgroundColor: C.primaryBg },
                  hovered && HoverShadowSoft,
                ]}
                onPress={() => goTo(tab.name)}
              >
                {focused && <Ionicons name={tab.icon as any} size={16} color={C.primaryDark} />}
                <Text style={[styles.linkText, { color: focused ? C.primaryDark : C.textSecondary, fontWeight: focused ? '700' : '600' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <View style={[styles.divider, { backgroundColor: C.border }]} />

          <Pressable
            style={({ hovered }: any) => [
              styles.iconBtn,
              preferencesDisabled && { opacity: 0.5 },
              isDark ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.backgroundGray, borderColor: C.border },
              hovered && { borderColor: C.primary },
              hovered && HoverShadowSoft,
            ]}
            onPress={() => handleThemeChange(!isDark)}
            disabled={preferencesDisabled}
            accessibilityState={{ disabled: preferencesDisabled }}
            accessibilityLabel="Cambiar tema"
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#fff' : C.primary} />
          </Pressable>

          <LanguageDropdown
            language={language}
            onSelect={handleLanguageChange}
            disabled={preferencesDisabled}
            accessibilityLabel={t('profileLanguage')}
            colors={{
              surface: C.surface, buttonBg: C.backgroundGray, border: C.border,
              text: C.textPrimary, hint: C.textHint, primary: C.primary, primaryBg: C.primaryBg,
            }}
          />

          <Pressable
            style={({ hovered }: any) => [
              styles.avatarPill,
              { backgroundColor: C.backgroundGray, borderColor: C.border },
              hovered && { borderColor: C.primary },
              hovered && HoverShadowSoft,
            ]}
            onPress={() => goTo('Profile')}
          >
            <LinearGradient colors={C.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color="#fff" />
            </LinearGradient>
            <Text style={[styles.avatarName, { color: C.textPrimary }]} numberOfLines={1}>{userName}</Text>
          </Pressable>
        </View>

      </View>

      {/* Muestra el error sin cambiar el valor confirmado; permite reintentar. */}
      {preferencesError && (
        <View style={{ paddingHorizontal: 26, paddingBottom: 10, gap: 6 }}>
          <Text accessibilityLiveRegion="polite" style={{ color: C.textSecondary }}>{preferencesError.message}</Text>
          <TouchableOpacity
            disabled={preferencesDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: preferencesDisabled }}
            onPress={() => { void retryPreferences(); }}
          >
            <Text style={{ color: C.primary, opacity: preferencesDisabled ? 0.5 : 1 }}>{t('statsRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 50,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 1500,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 26,
    paddingVertical: 14,
    gap: 22,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 40, height: 40 },
  appName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },

  links: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  link: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 42, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'transparent',
  },
  linkText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { width: 1, height: 32, backgroundColor: Colors.border, marginRight: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  avatarPill: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingLeft: 6, paddingRight: 14, borderRadius: 999, borderWidth: 1 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarName: { fontSize: 15, fontWeight: '700', maxWidth: 120, textTransform: 'capitalize' },
});