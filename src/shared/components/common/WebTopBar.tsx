
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Image } from 'react-native';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useLanguage, LANGUAGE_NAMES, type LanguageCode } from '../../../app/providers/LanguageContext';
import { useAuth } from '../../../app/providers/AuthContext';
import { isAdmin } from '../../../shared/utils/adminAccess';
import { HoverShadowSoft } from '../../../shared/constants/hoverStyles';

const LANG_CODES: LanguageCode[] = ['es', 'en', 'fr', 'pt'];
const LANG_FLAGS: Record<LanguageCode, string> = { es: '🇪🇸', en: '🇺🇸', fr: '🇫🇷', pt: '🇧🇷' };

export const WebTopBar: React.FC<BottomTabHeaderProps> = ({ navigation, route }) => {
  const currentTab = route.name;
  const C = useColors();
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [langOpen, setLangOpen] = useState(false);

  const userName = (user?.email?.split('@')[0] ?? 'Usuario');
  const admin = isAdmin(user);

  const TAB_ITEMS: { name: string; label: string; icon: string }[] = admin
    ? [
        { name: 'Stats', label: t('tabStats'), icon: 'bar-chart' },
        { name: 'Admin', label: t('tabAdmin'), icon: 'shield' },
      ]
    : [
        { name: 'Translation', label: t('tabTranslation'), icon: 'language' },
        { name: 'Alphabet',    label: t('tabAlphabet'),    icon: 'hand-left' },
        { name: 'History',     label: t('tabHistory'),     icon: 'time' },
      ];

  const homeRoute = admin ? 'Stats' : 'Translation';
  const goTo = (name: string) => navigation.navigate(name);

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
              isDark ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.backgroundGray, borderColor: C.border },
              hovered && { borderColor: C.primary },
              hovered && HoverShadowSoft,
            ]}
            onPress={toggleTheme}
            accessibilityLabel="Cambiar tema"
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#fff' : C.primary} />
          </Pressable>

          <View>
            <Pressable
              style={({ hovered }: any) => [
                styles.langBtn,
                { backgroundColor: C.backgroundGray, borderColor: C.border },
                hovered && { borderColor: C.primary },
                hovered && HoverShadowSoft,
              ]}
              onPress={() => setLangOpen(o => !o)}
            >
              <Ionicons name="globe-outline" size={18} color={C.primary} />
              <Text style={[styles.langText, { color: C.textPrimary }]}>{LANGUAGE_NAMES[language as LanguageCode]}</Text>
              <Ionicons name="chevron-down" size={16} color={C.textHint} />
            </Pressable>

            {langOpen && (
              <View style={[styles.langMenu, { backgroundColor: C.surface, borderColor: C.border, shadowColor: C.primary }]}>
                {LANG_CODES.map(code => {
                  const active = language === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.langItem, active && { backgroundColor: C.primaryBg }]}
                      onPress={() => { setLanguage(code); setLangOpen(false); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.langFlag}>{LANG_FLAGS[code]}</Text>
                      <Text style={[styles.langItemText, { color: C.textPrimary }]}>{LANGUAGE_NAMES[code]}</Text>
                      {active && <Ionicons name="checkmark" size={17} color={C.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

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
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  langText: { fontSize: 15, fontWeight: '700' },
  langMenu: {
    position: 'absolute', top: 52, right: 0, width: 220, borderRadius: 14, borderWidth: 1, padding: 8, zIndex: 100,
    shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 12,
  },
  langItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, paddingHorizontal: 12, borderRadius: 10 },
  langFlag: { fontSize: 20 },
  langItemText: { flex: 1, fontSize: 15, fontWeight: '600' },

  avatarPill: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingLeft: 6, paddingRight: 14, borderRadius: 999, borderWidth: 1 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarName: { fontSize: 15, fontWeight: '700', maxWidth: 120, textTransform: 'capitalize' },
});
