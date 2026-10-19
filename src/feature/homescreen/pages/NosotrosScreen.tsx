import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicHeader } from '../../../shared/components/common/PublicHeader';
import { PublicFooter } from '../../../shared/components/common/PublicFooter';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';

const PILLARS: { icon: keyof typeof Ionicons.glyphMap; title: TranslationKey; desc: TranslationKey; color: string; bg: string }[] = [
  { icon: 'flag-outline', title: 'pubAbMissionTitle', desc: 'pubAbMissionDesc', color: D.purple, bg: D.lilacBg },
  { icon: 'heart-outline', title: 'pubAbWhyTitle', desc: 'pubAbWhyDesc', color: D.green, bg: D.greenBg },
  { icon: 'rocket-outline', title: 'pubAbHowTitle', desc: 'pubAbHowDesc', color: D.amber, bg: D.amberBg },
];

const TEAM: { name: string; role: TranslationKey; icon: keyof typeof Ionicons.glyphMap; bio: TranslationKey; tint: string; color: string }[] = [
  { name: 'Juan Mauricio Suaza Solórzano', role: 'pubAbRoleLead', icon: 'code-slash', bio: 'pubAbBio', tint: D.lilacSoft, color: D.violet },
  { name: 'Luis Alejandro Duarte Aldana', role: 'pubAbRoleDev', icon: 'code-slash', bio: 'pubAbBio', tint: D.greenBg, color: D.green },
  { name: 'Juan Camilo Fierro Esquivel', role: 'pubAbRoleDev', icon: 'code-slash', bio: 'pubAbBio', tint: D.amberBg, color: D.amber },
];

const STATS: { value: string; label: TranslationKey }[] = [
  { value: '3', label: 'pubAbStatMembers' },
  { value: 'Neiva', label: 'pubAbStatBase' },
  { value: 'LSC', label: 'pubAbStatLanguage' },
];

export const NosotrosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMid = width >= 640;

  return (
    <View style={styles.root}>
      <PublicHeader active="nosotros" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#FBFAFE', '#F5F2FC']} style={styles.heroBg}>
          <View style={styles.heroInner}>
            <View style={styles.pill}>
              <Ionicons name="location-outline" size={14} color={D.purple} />
              <Text style={styles.pillText}>{t('pubAbLocation')}</Text>
            </View>
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
              {t('pubAbTitle')}<Text style={{ color: D.purple }}>{t('pubAbTitleAccent')}</Text>{t('pubAbTitleEnd')}
            </Text>
            <Text style={styles.heroSub}>{t('pubAbSubtitle')}</Text>
          </View>
        </LinearGradient>

        {/* Pilares */}
        <View style={styles.section}>
          <View style={[styles.pillarsGrid, isWide && styles.pillarsGridWide]}>
            {PILLARS.map(p => (
              <View key={p.title} style={[styles.pillar, isWide && { flex: 1 }]}>
                <View style={[styles.pillarIcon, { backgroundColor: p.bg }]}>
                  <Ionicons name={p.icon} size={22} color={p.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pillarTitle}>{t(p.title)}</Text>
                  <Text style={styles.pillarDesc}>{t(p.desc)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Equipo */}
        <View style={styles.section}>
          <Text style={styles.h2}>{t('pubAbTeam')}</Text>
          <Text style={styles.h2Sub}>{t('pubAbTeamSub')}</Text>
          <View style={[styles.teamGrid, isMid && styles.teamGridWide]}>
            {TEAM.map((m, i) => (
              <View key={i} style={[styles.teamCard, isMid && { flex: 1 }]}>
                <View style={[styles.avatar, { backgroundColor: m.tint }]}>
                  <Ionicons name={m.icon} size={44} color={m.color} />
                </View>
                <Text style={styles.teamName}>{m.name}</Text>
                <View style={[styles.rolePill, { backgroundColor: m.tint }]}>
                  <Ionicons name={m.icon} size={14} color={m.color} />
                  <Text style={[styles.roleText, { color: m.color }]}>{t(m.role)}</Text>
                </View>
                <Text style={styles.teamBio}>{t(m.bio)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Banner Neiva */}
        <View style={styles.section}>
          <LinearGradient colors={['#EFE8FB', '#E4D8F6']} style={[styles.banner, isWide && styles.bannerWide]}>
            <View style={isWide && { flex: 1.2 }}>
              <View style={[styles.pill, { backgroundColor: D.white }]}>
                <Ionicons name="location-outline" size={14} color={D.purple} />
                <Text style={styles.pillText}>{t('pubAbMadeIn')}</Text>
              </View>
              <Text style={styles.bannerTitle}>{t('pubAbBannerTitle')}</Text>
              <Text style={styles.bannerText}>{t('pubAbBannerText')}</Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Register')} style={styles.bannerBtnWrap}>
                <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>{t('pubAbMeetUs')}</Text>
                  <Ionicons name="arrow-forward" size={18} color={D.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={[styles.statsGrid, isWide && { flex: 0.8 }]}>
              {STATS.map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{t(s.label)}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        <PublicFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.white },
  heroBg: { width: '100%' },
  heroInner: { maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 52, alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'center',
    backgroundColor: D.lilacSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 20,
  },
  pillText: { fontSize: 13, fontWeight: '700', color: D.purpleDark },
  heroTitle: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.7, maxWidth: 720, marginBottom: 18 },
  heroTitleWide: { fontSize: 46, lineHeight: 52 },
  heroSub: { fontSize: 17, lineHeight: 28, color: D.body, textAlign: 'center', maxWidth: 620 },

  section: { maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  pillarsGrid: { gap: 28 },
  pillarsGridWide: { flexDirection: 'row' },
  pillar: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  pillarIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pillarTitle: { fontSize: 17, fontWeight: '800', color: D.ink, marginBottom: 6 },
  pillarDesc: { fontSize: 14, lineHeight: 22, color: D.body },

  h2: { fontSize: 28, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 },
  h2Sub: { fontSize: 15, color: D.hint, textAlign: 'center', fontWeight: '600', marginBottom: 34 },
  teamGrid: { gap: 26 },
  teamGridWide: { flexDirection: 'row' },
  teamCard: { borderWidth: 1, borderColor: D.lilacBorder, borderRadius: 22, padding: 26, alignItems: 'center' },
  avatar: {
    width: 128, height: 128, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 5,
  },
  teamName: { fontSize: 19, fontWeight: '800', color: D.ink, marginBottom: 5 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, marginBottom: 14 },
  roleText: { fontSize: 13, fontWeight: '800' },
  teamBio: { fontSize: 14, lineHeight: 22, color: D.body, textAlign: 'center' },

  banner: { borderRadius: 24, padding: 40, gap: 32 },
  bannerWide: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: 26, fontWeight: '800', color: D.ink, letterSpacing: -0.4, marginTop: 16, marginBottom: 12 },
  bannerText: { fontSize: 16, lineHeight: 26, color: D.bodyDeep },
  bannerBtnWrap: { alignSelf: 'flex-start', borderRadius: 12, overflow: 'hidden', marginTop: 22 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 52, paddingHorizontal: 26 },
  bannerBtnText: { fontSize: 15, fontWeight: '700', color: D.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: { backgroundColor: D.white, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 18, alignItems: 'center', minWidth: '44%', flexGrow: 1 },
  statValue: { fontSize: 30, fontWeight: '900', color: D.purple, letterSpacing: -0.5 },
  statLabel: { fontSize: 13, fontWeight: '700', color: D.body, marginTop: 4 },
});
