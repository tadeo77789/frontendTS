import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LandingTheme as D } from '../../constants/landingTheme';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';

// Ano fijo del copyright del proyecto.
const CURRENT_YEAR = 2025;

const QUICK: { label: TranslationKey; route: string }[] = [
  { label: 'pubNavTranslator', route: 'TraductorDemo' },
  { label: 'pubNavAlphabet',   route: 'AlfabetoDemo' },
  { label: 'pubNavAbout',      route: 'Nosotros' },
];

const RESOURCES: { label: TranslationKey; route: string }[] = [
  { label: 'pubFooterStats',   route: 'Login' },
  { label: 'pubFooterHistory', route: 'Login' },
  { label: 'pubFooterProfile', route: 'Login' },
  { label: 'pubFooterTerms',   route: 'Terms' },
  { label: 'pubFooterPrivacy', route: 'PrivacyPolicy' },
];

const CONTACT: { icon: keyof typeof Ionicons.glyphMap; text: TranslationKey }[] = [
  { icon: 'location-outline', text: 'pubFooterLocation' },
];

export const PublicFooter: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMid = width >= 640;

  return (
    <View style={styles.footer}>
      <View style={styles.inner}>
        <View style={[styles.cols, isWide && styles.colsWide]}>
          {/* Marca */}
          <View style={isWide && { flex: 1.8 }}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Image source={require('../../../assets/images/icono-senas.png')} style={styles.logoImg} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.brandName}>TraduceSeña</Text>
                <Text style={styles.brandTagline}>{t('pubTagline')}</Text>
              </View>
            </View>
            <Text style={styles.about}>{t('pubFooterAbout')}</Text>
          </View>

          {/* Enlaces rápidos */}
          <View style={[styles.col, isWide && { flex: 1 }]}>
            <Text style={styles.colTitle}>{t('pubFooterQuickLinks')}</Text>
            {QUICK.map(l => (
              <TouchableOpacity key={l.label} onPress={() => navigation.navigate(l.route)}>
                <Text style={styles.link}>{t(l.label)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recursos */}
          <View style={[styles.col, isWide && { flex: 1 }]}>
            <Text style={styles.colTitle}>{t('pubFooterResources')}</Text>
            {RESOURCES.map(l => (
              <TouchableOpacity key={l.label} onPress={() => navigation.navigate(l.route)}>
                <Text style={styles.link}>{t(l.label)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contacto */}
          <View style={[styles.col, isWide && { flex: 1.4 }]}>
            <Text style={styles.colTitle}>{t('pubFooterContact')}</Text>
            {CONTACT.map(c => (
              <View key={c.text} style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons name={c.icon} size={17} color={D.purple} />
                </View>
                <Text style={styles.contactText}>{t(c.text)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={[styles.bottom, !isMid && styles.bottomStack]}>
          <Text style={styles.copy}>{t('pubFooterRights', { year: CURRENT_YEAR })}</Text>
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.bottomLink}>{t('pubFooterTerms')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.bottomLink}>{t('pubFooterPrivacy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { backgroundColor: D.footerBg, borderTopWidth: 1, borderTopColor: D.lilacLine },
  inner: { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 52, paddingBottom: 26 },
  cols: { gap: 40 },
  colsWide: { flexDirection: 'row', gap: 48 },

  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 38, height: 38 },
  brandName: { fontSize: 18, fontWeight: '800', color: D.ink },
  brandTagline: { fontSize: 11, color: D.hint, fontWeight: '600', marginTop: 3 },
  about: { fontSize: 14, lineHeight: 22, color: D.body, maxWidth: 260, marginTop: 16 },

  col: { gap: 13 },
  colTitle: { fontSize: 15, fontWeight: '800', color: D.ink, marginBottom: 5 },
  link: { fontSize: 14, fontWeight: '600', color: D.body },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center' },
  contactText: { fontSize: 14, fontWeight: '600', color: D.body },

  divider: { height: 1, backgroundColor: D.divider, marginTop: 44, marginBottom: 22 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' },
  bottomStack: { flexDirection: 'column', alignItems: 'flex-start' },
  copy: { fontSize: 13, fontWeight: '600', color: D.hint },
  bottomLinks: { flexDirection: 'row', gap: 24 },
  bottomLink: { fontSize: 13, fontWeight: '600', color: D.hint },
});
