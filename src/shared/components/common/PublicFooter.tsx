import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LandingTheme as D } from '../../constants/landingTheme';

// Ano fijo del copyright del proyecto.
const CURRENT_YEAR = 2025;

const SOCIAL: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'logo-facebook',  label: 'Facebook' },
  { icon: 'logo-instagram', label: 'Instagram' },
  { icon: 'logo-youtube',   label: 'YouTube' },
  { icon: 'mail-outline',   label: 'Correo' },
];

const QUICK: { label: string; route: string }[] = [
  { label: 'Traductor', route: 'TraductorDemo' },
  { label: 'Alfabeto',  route: 'AlfabetoDemo' },
  { label: 'Nosotros',  route: 'Nosotros' },
];

const RESOURCES: { label: string; route: string }[] = [
  { label: 'Estadísticas', route: 'Login' },
  { label: 'Historial',    route: 'Login' },
  { label: 'Perfil',       route: 'Login' },
  { label: 'Términos y condiciones', route: 'Terms' },
  { label: 'Política de privacidad', route: 'PrivacyPolicy' },
];

const CONTACT: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'mail-outline',     text: 'hola@traducesena.com' },
  { icon: 'call-outline',     text: '+57 300 123 4567' },
  { icon: 'location-outline', text: 'Neiva, Huila — Colombia' },
];

export const PublicFooter: React.FC = () => {
  const navigation = useNavigation<any>();
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
                <Text style={styles.brandTagline}>Lengua de señas para todos</Text>
              </View>
            </View>
            <Text style={styles.about}>
              Tecnología y educación para un mundo más inclusivo. Comunicación sin límites.
            </Text>
            <View style={styles.socialRow}>
              {SOCIAL.map(s => (
                <TouchableOpacity key={s.label} style={styles.socialBtn} accessibilityLabel={s.label}>
                  <Ionicons name={s.icon} size={18} color={D.purple} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Enlaces rápidos */}
          <View style={[styles.col, isWide && { flex: 1 }]}>
            <Text style={styles.colTitle}>Enlaces rápidos</Text>
            {QUICK.map(l => (
              <TouchableOpacity key={l.label} onPress={() => navigation.navigate(l.route)}>
                <Text style={styles.link}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recursos */}
          <View style={[styles.col, isWide && { flex: 1 }]}>
            <Text style={styles.colTitle}>Recursos</Text>
            {RESOURCES.map(l => (
              <TouchableOpacity key={l.label} onPress={() => navigation.navigate(l.route)}>
                <Text style={styles.link}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contacto */}
          <View style={[styles.col, isWide && { flex: 1.4 }]}>
            <Text style={styles.colTitle}>Contacto</Text>
            {CONTACT.map(c => (
              <View key={c.text} style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons name={c.icon} size={17} color={D.purple} />
                </View>
                <Text style={styles.contactText}>{c.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={[styles.bottom, !isMid && styles.bottomStack]}>
          <Text style={styles.copy}>© {CURRENT_YEAR} TraduceSeña. Todos los derechos reservados.</Text>
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.bottomLink}>Términos y condiciones</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.bottomLink}>Política de privacidad</Text>
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
  about: { fontSize: 14, lineHeight: 22, color: D.body, maxWidth: 260, marginTop: 16, marginBottom: 20 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { width: 40, height: 40, borderRadius: 11, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center' },

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
