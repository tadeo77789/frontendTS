import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';

const SECTION_KEYS: { title: TranslationKey; body: TranslationKey; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { title: 'privacySection1Title',  body: 'privacySection1Body',  icon: 'server-outline' },
  { title: 'privacySection2Title',  body: 'privacySection2Body',  icon: 'camera-outline' },
  { title: 'privacySection3Title',  body: 'privacySection3Body',  icon: 'locate-outline' },
  { title: 'privacySection4Title',  body: 'privacySection4Body',  icon: 'lock-closed-outline' },
  { title: 'privacySection5Title',  body: 'privacySection5Body',  icon: 'person-outline' },
  { title: 'privacySection6Title',  body: 'privacySection6Body',  icon: 'refresh-outline' },
  { title: 'privacySection7Title',  body: 'privacySection7Body',  icon: 'share-social-outline' },
  { title: 'privacySection8Title',  body: 'privacySection8Body',  icon: 'time-outline' },
  { title: 'privacySection9Title',  body: 'privacySection9Body',  icon: 'globe-outline' },
  { title: 'privacySection10Title', body: 'privacySection10Body', icon: 'mail-outline' },
  { title: 'privacySection11Title', body: 'privacySection11Body', icon: 'document-text-outline' },
];

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const C = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: C.backgroundGray }]}>
          <View style={styles.heroInner}>
            <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={17} color={C.primaryDark} />
              <Text style={[styles.backLinkText, { color: C.primaryDark }]}>Volver</Text>
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: C.primaryBg }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color={C.primary} />
              <Text style={[styles.badgeText, { color: C.primaryDark }]}>Legal</Text>
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>{t('privacyScreenTitle')}</Text>
            <Text style={[styles.date, { color: C.textHint }]}>{t('privacyLastUpdated')}</Text>
          </View>
        </View>

        {/* Secciones */}
        <View style={styles.body}>
          <View style={[styles.highlight, { backgroundColor: C.primaryBg }]}>
            <Ionicons name="lock-closed" size={16} color={C.primary} />
            <Text style={[styles.highlightText, { color: C.textPrimary }]}>{t('privacyHighlight')}</Text>
          </View>

          {SECTION_KEYS.map((s, i) => (
            <View key={i} style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={[styles.iconBadge, { backgroundColor: C.primaryBg }]}>
                  <Ionicons name={s.icon} size={18} color={C.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>{t(s.title)}</Text>
              </View>
              <Text style={[styles.sectionBody, { color: C.textSecondary }]}>{t(s.body)}</Text>
            </View>
          ))}

          <View style={[styles.contactCard, { backgroundColor: C.backgroundGray, borderColor: C.border }]}>
            <Text style={[styles.contactText, { color: C.textSecondary }]}>{t('privacyFooter')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 56 },

  hero: { width: '100%' },
  heroInner: { maxWidth: 820, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 44, paddingBottom: 30 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 16 },
  backLinkText: { fontSize: 14, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, marginBottom: 16 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6, marginBottom: 8 },
  date: { fontSize: 14, fontWeight: '600' },

  body: { maxWidth: 820, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 30 },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 16, marginBottom: 26 },
  highlightText: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '600' },

  section: { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionBody: { fontSize: 15, lineHeight: 25, paddingLeft: 46 },

  contactCard: { borderRadius: 16, borderWidth: 1, padding: 22, marginTop: 4 },
  contactText: { fontSize: 14, lineHeight: 22 },
});
