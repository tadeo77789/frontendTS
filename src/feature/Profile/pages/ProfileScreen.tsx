
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/providers/AuthContext';
import { useTheme, useColors, type ColorAccent } from '../../../app/providers/ThemeContext';
import { useLanguage, type LanguageCode } from '../../../app/providers/LanguageContext';
import { useTranslation } from '../../../app/config/i18n';

const LANG_CODES: LanguageCode[] = ['es', 'en', 'fr', 'pt'];

const COLOR_ACCENTS: { key: ColorAccent; label: string; color: string; dark: string }[] = [
  { key: 'purple', label: 'Morado', color: '#9B77E6', dark: '#9D60F5' },
  { key: 'green',  label: 'Verde',  color: '#4CAF82', dark: '#5DBF92' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, resetTheme, colorAccent, setColorAccent } = useTheme();
  const C = useColors();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const displayName = user?.email?.split('@')[0] ?? 'Usuario';
  const displayEmail = user?.email ?? 'usuario@traducesenas.com';

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (confirm(t('profileConfirmLogout'))) { resetTheme(); await logout(); }
    } else {
      Alert.alert(t('logout'), t('profileConfirmLogout'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('profileLogout'), style: 'destructive', onPress: async () => { resetTheme(); await logout(); } },
      ]);
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if (confirm(t('profileConfirmDelete'))) { alert(t('profileAccountDeleted')); }
    } else {
      Alert.alert(t('profileDeleteAccount'), t('profileConfirmDelete'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => Alert.alert(t('profileAccountDeleted')) },
      ]);
    }
  };

  const IconBox: React.FC<{ name: React.ComponentProps<typeof Ionicons>['name'] }> = ({ name }) => (
    <View style={[styles.iconBox, { backgroundColor: C.primaryBg }]}>
      <Ionicons name={name} size={20} color={C.primary} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>

          {/* Hero */}
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <LinearGradient colors={[C.primaryLight, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.avatar, { shadowColor: C.primary }]}>
              <Ionicons name="person" size={48} color="#fff" />
            </LinearGradient>
            <View style={[styles.heroInfo, isWide && styles.heroInfoWide]}>
              <Text style={[styles.userName, { color: C.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.userEmail, { color: C.textSecondary }]}>{displayEmail}</Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: C.primary }]}>1,248</Text>
                <Text style={[styles.heroStatLabel, { color: C.textSecondary }]}>{t('profileTranslations')}</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={[styles.heroStatValue, { color: C.primary }]}>84</Text>
                <Text style={[styles.heroStatLabel, { color: C.textSecondary }]}>{t('profileLearned')}</Text>
              </View>
            </View>
          </View>

          {/* Cuenta */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('profileAccount')}</Text>

            <View style={[styles.row, styles.rowDivider, { borderBottomColor: C.border }]}>
              <IconBox name="person-outline" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowSub, { color: C.textSecondary }]}>{t('name')}</Text>
                <Text style={[styles.rowValue, { color: C.textPrimary }]}>{displayName}</Text>
              </View>
            </View>

            <View style={[styles.row, styles.rowDivider, { borderBottomColor: C.border }]}>
              <IconBox name="mail-outline" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowSub, { color: C.textSecondary }]}>{t('email')}</Text>
                <Text style={[styles.rowValue, { color: C.textPrimary }]}>{displayEmail}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <IconBox name="lock-closed-outline" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowSub, { color: C.textSecondary }]}>{t('password')}</Text>
                <Text style={[styles.rowValue, { color: C.textPrimary, letterSpacing: 2 }]}>••••••••</Text>
              </View>
              
              <TouchableOpacity style={styles.linkRow}
               onPress={() => navigation.navigate('ChangePassword')}>

                <Ionicons name="key-outline" size={15} color={C.primary} />
                <Text style={[styles.link, { color: C.primary }]}>{t('profileChangePassword')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferencias */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('profilePreferences')}</Text>

            <View style={[styles.prefRow, !isWide && styles.prefRowStacked, styles.rowDivider, { borderBottomColor: C.border }]}>
              <View style={styles.prefLeft}>
                <IconBox name="color-palette-outline" />
                <Text style={[styles.prefLabel, { color: C.textPrimary }]}>Color de la app</Text>
              </View>
              <View style={[styles.chipsRow, !isWide && styles.chipsRowStacked]}>
                {COLOR_ACCENTS.map(accent => {
                  const selected = colorAccent === accent.key;
                  const accentColor = isDark ? accent.dark : accent.color;
                  return (
                    <TouchableOpacity
                      key={accent.key}
                      onPress={() => setColorAccent(accent.key)}
                      activeOpacity={0.8}
                      style={[
                        styles.colorChip,
                        { borderColor: selected ? accentColor : C.border, backgroundColor: selected ? accentColor + '18' : C.surface },
                      ]}
                    >
                      <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
                      <Text style={[styles.colorChipText, { color: selected ? C.textPrimary : C.textSecondary }]}>{accent.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.prefRow, styles.rowDivider, { borderBottomColor: C.border }]}>
              <View style={styles.prefLeft}>
                <IconBox name={isDark ? 'moon-outline' : 'sunny-outline'} />
                <Text style={[styles.prefLabel, { color: C.textPrimary }]}>
                  {t('profileThemeLabel')} {isDark ? t('profileThemeDark') : t('profileThemeLight')}
                </Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.toggleOff, true: C.primary }} thumbColor="#fff" />
            </View>

            <View style={[styles.prefRow, styles.rowDivider, { borderBottomColor: C.border }]}>
              <View style={styles.prefLeft}>
                <IconBox name="notifications-outline" />
                <Text style={[styles.prefLabel, { color: C.textPrimary }]}>{t('profileNotifications')}</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: C.toggleOff, true: C.primary }} thumbColor="#fff" />
            </View>

            <View style={[styles.prefRow, !isWide && styles.prefRowStacked]}>
              <View style={styles.prefLeft}>
                <IconBox name="language-outline" />
                <Text style={[styles.prefLabel, { color: C.textPrimary }]}>{t('profileLanguage')}</Text>
              </View>
              <View style={[styles.chipsRow, !isWide && styles.chipsRowStacked]}>
                {LANG_CODES.map(code => {
                  const active = language === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      onPress={() => setLanguage(code)}
                      style={[styles.langChip, active ? { backgroundColor: C.primary, borderColor: C.primary } : { backgroundColor: C.surface, borderColor: C.border }]}
                    >
                      <Text style={[styles.langChipText, { color: active ? '#fff' : C.textSecondary }]}>{code.toUpperCase()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Acerca de */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('profileAbout')}</Text>
            <View style={[styles.aboutRow, styles.rowDivider, { borderBottomColor: C.border }]}>
              <Text style={[styles.prefLabel, { color: C.textPrimary }]}>{t('profileAppVersion')}</Text>
              <Text style={[styles.rowValue, { color: C.textSecondary }]}>1.0.0</Text>
            </View>
            <View style={styles.aboutLinks}>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                <Text style={[styles.link, { color: C.primary }]}>{t('profileTerms')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                <Text style={[styles.link, { color: C.primary }]}>{t('profilePrivacy')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Acciones */}
          <View style={[styles.actions, !isWide && styles.actionsStack]}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: C.borderInput, backgroundColor: C.surface }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={19} color={C.primary} />
              <Text style={[styles.actionText, { color: C.primary }]}>{t('profileLogout')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#F3D3D3', backgroundColor: C.surface }]} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={19} color={C.danger} />
              <Text style={[styles.actionText, { color: C.danger }]}>{t('profileDeleteAccount')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundGray },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  inner: { width: '100%', maxWidth: 880, alignSelf: 'center', gap: 22 },

  hero: { alignItems: 'center', gap: 16, paddingVertical: 8 },
  heroWide: { flexDirection: 'row' },
  avatar: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 26, elevation: 10,
  },
  heroInfo: { flex: 1, alignItems: 'center' },
  heroInfoWide: { alignItems: 'flex-start' },
  userName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, textTransform: 'capitalize' },
  userEmail: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  heroStats: { flexDirection: 'row', gap: 26 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 26, fontWeight: '900' },
  heroStatLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  card: { borderRadius: 20, borderWidth: 1, padding: 26 },
  cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 20 },

  iconBox: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  rowDivider: { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1 },
  rowSub: { fontSize: 13, fontWeight: '700' },
  rowValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  link: { fontSize: 14, fontWeight: '700' },

  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 13, flexShrink: 1 },
  prefLabel: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  // En pantallas estrechas la etiqueta y los chips van apilados: si comparten fila,
  // chipsRow no encoge y el texto queda espachurrado en una columna de una palabra.
  prefRowStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  chipsRowStacked: { justifyContent: 'flex-start' },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 38, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1.5 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorChipText: { fontSize: 13, fontWeight: '700' },
  langChip: { height: 36, minWidth: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  langChipText: { fontSize: 13, fontWeight: '800' },

  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aboutLinks: { flexDirection: 'row', gap: 24 },

  actions: { flexDirection: 'row', gap: 14 },
  actionsStack: { flexDirection: 'column' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    height: 54, borderRadius: 12, borderWidth: 1.5,
  },
  actionText: { fontSize: 15, fontWeight: '700' },
});
