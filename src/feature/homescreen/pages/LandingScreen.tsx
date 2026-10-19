import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicHeader } from '../../../shared/components/common/PublicHeader';
import { PublicFooter } from '../../../shared/components/common/PublicFooter';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';
import { APK_DOWNLOAD_URL } from '../../../app/config/api.config';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: TranslationKey; desc: TranslationKey; cta: TranslationKey; route: string }[] = [
  {
    icon: 'text-outline',
    title: 'pubNavAlphabet',
    desc: 'pubFeatAlphabetDesc',
    cta: 'pubFeatAlphabetCta',
    route: 'AlfabetoDemo',
  },
  {
    icon: 'camera-outline',
    title: 'pubNavTranslator',
    desc: 'pubFeatTranslatorDesc',
    cta: 'pubFeatTranslatorCta',
    route: 'TraductorDemo',
  },
];

export const LandingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMid = width >= 640;

  return (
    <View style={styles.root}>
      <PublicHeader active="inicio" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ---------- HERO ---------- */}
        <LinearGradient
          colors={['#FBFAFE', '#F7F4FD', '#F3EFFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={styles.heroBg}
        >
          <View style={[styles.heroInner, isWide && styles.heroInnerWide]}>
            {/* Columna texto */}
            <View style={styles.heroText}>
              <View style={styles.heroBadge}>
                <Ionicons name="heart" size={14} color={D.purple} />
                <Text style={styles.heroBadgeText}>{t('pubHeroBadge')}</Text>
              </View>

              <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
                {t('pubHeroTitle')}
                <Text style={styles.heroTitleAccent}>{t('pubHeroTitleAccent')}</Text>
              </Text>

              <View style={styles.heroDivider} />

              <Text style={styles.heroSubtitle}>{t('pubHeroSubtitle')}</Text>

              <View style={[styles.heroActions, !isMid && styles.heroActionsStack]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Register')}
                  style={styles.primaryBtn}
                >
                  <View style={styles.primaryBtnDot}>
                    <Ionicons name="play" size={12} color={D.white} />
                  </View>
                  <Text style={styles.primaryBtnText}>{t('pubStartNow')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('TraductorDemo')}
                  style={styles.ghostBtn}
                >
                  <Ionicons name="play-circle-outline" size={19} color={D.purple} />
                  <Text style={styles.ghostBtnText}>{t('pubSeeDemo')}</Text>
                </TouchableOpacity>
              </View>

              {/* Descarga de la app Android (APK) */}
              {APK_DOWNLOAD_URL !== '' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { void Linking.openURL(APK_DOWNLOAD_URL); }}
                  style={[styles.apkBtn, !isMid && styles.apkBtnStack]}
                  accessibilityRole="link"
                >
                  <View style={styles.apkIcon}>
                    <Ionicons name="logo-android" size={20} color={D.white} />
                  </View>
                  <View style={styles.apkTextCol}>
                    <Text style={styles.apkTitle}>{t('pubDownloadApk')}</Text>
                    <Text style={styles.apkHint}>{t('pubDownloadApkHint')}</Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={D.purple} />
                </TouchableOpacity>
              )}
            </View>

            {/* Columna imágenes */}
            <View style={[styles.heroMedia, isWide && styles.heroMediaWide]}>
              <View style={styles.heroBlob} />

              <View style={styles.plate}>
                <Image
                  source={require('../../../assets/images/comunicate-sinbarreras.png')}
                  style={styles.plateImg}
                  resizeMode="cover"
                />
                <View style={styles.plateCard}>
                  <View style={styles.plateCardIcon}>
                    <Ionicons name="videocam-outline" size={18} color={D.purple} />
                  </View>
                  <View>
                    <Text style={styles.plateCardTitle}>{t('pubLiveSigns')}</Text>
                    <Text style={styles.plateCardSub}>{t('pubLiveRecognizing')}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.plate}>
                <Image
                  source={require('../../../assets/images/traduccion-real.png')}
                  style={styles.plateImg}
                  resizeMode="cover"
                />
                <View style={[styles.plateCard, styles.plateCardWide]}>
                  <View style={styles.plateCardIcon}>
                    <Ionicons name="chatbubbles-outline" size={18} color={D.purple} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plateCardTitle}>{t('pubTranslationLabel')}</Text>
                    <Text style={[styles.plateCardSub, { color: D.body }]}>{t('pubSampleSentence')}</Text>
                  </View>
                  <View style={styles.plateCardRound}>
                    <Ionicons name="volume-high-outline" size={16} color={D.purple} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ---------- FEATURES ---------- */}
        <View style={styles.featuresSection}>
          <View style={[styles.featuresGrid, isMid && styles.featuresGridWide]}>
            {FEATURES.map(f => (
              <TouchableOpacity
                key={f.title}
                activeOpacity={0.9}
                style={[styles.featureCard, isMid && styles.featureCardHalf]}
                onPress={() => navigation.navigate(f.route)}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={26} color={D.purple} />
                </View>
                <Text style={styles.featureTitle}>{t(f.title)}</Text>
                <Text style={styles.featureDesc}>{t(f.desc)}</Text>
                <View style={styles.featureCta}>
                  <Text style={styles.featureCtaText}>{t(f.cta)}</Text>
                  <Ionicons name="arrow-forward" size={15} color={D.purple} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PublicFooter />
      </ScrollView>
    </View>
  );
};

const CARD_SHADOW = {
  shadowColor: '#7C3AED',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 6,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.white },
  scroll: { flexGrow: 1 },

  /* Hero */
  heroBg: { width: '100%' },
  heroInner: {
    maxWidth: 1200, width: '100%', alignSelf: 'center',
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 64, gap: 40,
  },
  heroInnerWide: { flexDirection: 'row', alignItems: 'center', gap: 48, paddingTop: 72, paddingBottom: 84 },
  heroText: { flex: 1.05 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start',
    backgroundColor: D.lilacSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 24,
  },
  heroBadgeText: { fontSize: 13, fontWeight: '700', color: D.purpleDark },
  heroTitle: { fontSize: 36, lineHeight: 42, fontWeight: '800', color: D.ink, letterSpacing: -0.5, marginBottom: 22 },
  heroTitleWide: { fontSize: 50, lineHeight: 56 },
  heroTitleAccent: { color: D.purple },
  heroDivider: { width: 48, height: 3, borderRadius: 2, backgroundColor: D.accentLine, marginBottom: 22 },
  heroSubtitle: { fontSize: 17, lineHeight: 28, color: D.body, maxWidth: 420, marginBottom: 34 },
  heroActions: { flexDirection: 'row', gap: 16 },
  heroActionsStack: { flexDirection: 'column', alignItems: 'stretch' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11,
    height: 54, paddingHorizontal: 26, borderRadius: 12, backgroundColor: D.purpleBtn,
    ...CARD_SHADOW, shadowOpacity: 0.28, shadowRadius: 12,
  },
  primaryBtnDot: {
    width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: D.white },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 54, paddingHorizontal: 26, borderRadius: 12, borderWidth: 1.5, borderColor: D.borderSoft, backgroundColor: D.white,
  },
  ghostBtnText: { fontSize: 16, fontWeight: '700', color: D.purple },
  apkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start', marginTop: 18,
    paddingVertical: 10, paddingLeft: 10, paddingRight: 18, borderRadius: 14,
    borderWidth: 1.5, borderColor: D.borderSoft, backgroundColor: D.white,
  },
  apkBtnStack: { alignSelf: 'stretch' },
  apkIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: D.green, alignItems: 'center', justifyContent: 'center' },
  apkTextCol: { flexShrink: 1 },
  apkTitle: { fontSize: 15, fontWeight: '700', color: D.ink },
  apkHint: { fontSize: 12, fontWeight: '600', color: D.hint, marginTop: 2 },

  heroMedia: { gap: 18 },
  heroMediaWide: { flex: 0.95 },
  heroBlob: {
    position: 'absolute', right: -20, top: -20, width: 300, height: 300, borderRadius: 999,
    backgroundColor: '#D6C8F7', opacity: 0.5,
  },
  plate: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: D.white,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.24, shadowRadius: 48, elevation: 10,
  },
  plateImg: { width: '100%', height: 200 },
  plateCard: {
    position: 'absolute', left: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 20, elevation: 5,
  },
  plateCardWide: { right: 16 },
  plateCardIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center' },
  plateCardTitle: { fontSize: 14, fontWeight: '700', color: D.ink },
  plateCardSub: { fontSize: 12, fontWeight: '600', color: D.hint, marginTop: 1 },
  plateCardRound: { width: 32, height: 32, borderRadius: 999, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center' },

  /* Features */
  featuresSection: { backgroundColor: D.white },
  featuresGrid: { maxWidth: 820, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 56, gap: 24 },
  featuresGridWide: { flexDirection: 'row' },
  featureCard: { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, borderRadius: 18, padding: 28 },
  featureCardHalf: { flex: 1 },
  featureIcon: { width: 54, height: 54, borderRadius: 15, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  featureTitle: { fontSize: 19, fontWeight: '700', color: D.ink, marginBottom: 11 },
  featureDesc: { fontSize: 15, lineHeight: 23, color: D.body, marginBottom: 20 },
  featureCta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureCtaText: { fontSize: 14, fontWeight: '700', color: D.purple },
});
