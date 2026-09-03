import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';

const SECTION_KEYS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'termsSection1Title', body: 'termsSection1Body' },
  { title: 'termsSection2Title', body: 'termsSection2Body' },
  { title: 'termsSection3Title', body: 'termsSection3Body' },
  { title: 'termsSection4Title', body: 'termsSection4Body' },
  { title: 'termsSection5Title', body: 'termsSection5Body' },
  { title: 'termsSection6Title', body: 'termsSection6Body' },
  { title: 'termsSection7Title', body: 'termsSection7Body' },
  { title: 'termsSection8Title', body: 'termsSection8Body' },
  { title: 'termsSection9Title', body: 'termsSection9Body' },
];

export const TermsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const C = useColors();
  const { t } = useTranslation();

  const renderBody = (bodyKey: TranslationKey) => {
    const text = t(bodyKey);
    if (bodyKey === 'termsSection6Body') {
      const linkText = t('termsPrivacyLinkText');
      const idx = text.indexOf(linkText);
      if (idx !== -1) {
        return (
          <>
            {text.slice(0, idx)}
            <Text style={[styles.link, { color: C.primary }]} onPress={() => navigation.navigate('PrivacyPolicy')}>{linkText}</Text>
            {text.slice(idx + linkText.length)}
          </>
        );
      }
    }
    return text;
  };

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
              <Ionicons name="document-text-outline" size={14} color={C.primary} />
              <Text style={[styles.badgeText, { color: C.primaryDark }]}>Legal</Text>
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>{t('termsScreenTitle')}</Text>
            <Text style={[styles.date, { color: C.textHint }]}>{t('termsLastUpdated')}</Text>
          </View>
        </View>

        {/* Secciones */}
        <View style={styles.body}>
          {SECTION_KEYS.map((s, i) => (
            <View key={i} style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={[styles.numBadge, { backgroundColor: C.primaryBg }]}>
                  <Text style={[styles.numText, { color: C.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>{t(s.title)}</Text>
              </View>
              <Text style={[styles.sectionBody, { color: C.textSecondary }]}>{renderBody(s.body)}</Text>
            </View>
          ))}

          <View style={[styles.contactCard, { backgroundColor: C.backgroundGray, borderColor: C.border }]}>
            <Text style={[styles.contactText, { color: C.textSecondary }]}>{t('termsFooter')}</Text>
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
  section: { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  numBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 15, fontWeight: '900' },
  sectionTitle: { flex: 1, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionBody: { fontSize: 15, lineHeight: 25, paddingLeft: 46 },
  link: { fontWeight: '700', textDecorationLine: 'underline' },

  contactCard: { borderRadius: 16, borderWidth: 1, padding: 22, marginTop: 4 },
  contactText: { fontSize: 14, lineHeight: 22 },
});
