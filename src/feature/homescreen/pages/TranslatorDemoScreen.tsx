import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicHeader } from '../../../shared/components/common/PublicHeader';
import { PublicFooter } from '../../../shared/components/common/PublicFooter';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';

const STEPS: { n: string; icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { n: '1', icon: 'videocam-outline', title: 'Activa la cámara', desc: 'Da permiso y ubica tus manos dentro del recuadro para empezar.' },
  { n: '2', icon: 'scan-outline', title: 'Haz la seña', desc: 'El modelo reconoce la configuración de tus manos en vivo.' },
  { n: '3', icon: 'volume-high-outline', title: 'Recibe el resultado', desc: 'Obtén el texto y escúchalo en voz alta al instante.' },
];

export const TranslatorDemoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMid = width >= 640;

  return (
    <View style={styles.root}>
      <PublicHeader active="traductor" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#FBFAFE', '#F3EFFB']} style={styles.heroBg}>
          <View style={styles.heroInner}>
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
              Traduce señas a <Text style={{ color: D.purple }}>texto y voz</Text>, en tiempo real
            </Text>
            <Text style={styles.heroSub}>
              La cámara reconoce tus señas y las convierte en texto y voz al instante. Esta es una
              demostración del traductor; inicia sesión para usarlo en vivo.
            </Text>
            <View style={[styles.heroActions, !isMid && { flexDirection: 'column', alignSelf: 'stretch' }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Register')} style={styles.primaryBtnWrap}>
                <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Crear cuenta</Text>
                  <Ionicons name="arrow-forward" size={18} color={D.white} />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Login')} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Demo cards */}
        <View style={styles.section}>
          <View style={[styles.demoGrid, isMid && styles.demoGridWide]}>
            {/* Cámara */}
            <View style={[styles.demoCard, isMid && { flex: 1 }]}>
              <View style={styles.demoHead}>
                <View style={styles.demoHeadIcon}>
                  <Ionicons name="videocam-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.demoHeadText}>Cámara en vivo</Text>
              </View>
              <View style={styles.camBox}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.camIcon}>
                  <Ionicons name="camera-outline" size={38} color="#7C3AED" />
                </View>
                <Text style={styles.camTitle}>La cámara reconoce tus señas</Text>
                <Text style={styles.camSub}>Vista previa — disponible al iniciar sesión</Text>
              </View>
            </View>

            {/* Traducción */}
            <View style={[styles.demoCard, isMid && { flex: 1 }]}>
              <View style={styles.demoHead}>
                <View style={styles.demoHeadIcon}>
                  <Ionicons name="chatbox-ellipses-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.demoHeadText}>Traducción</Text>
              </View>
              <View style={styles.transBox}>
                <Text style={styles.transText}>Hola, ¿cómo estás?</Text>
                <Text style={styles.transSub}>Texto y voz al instante</Text>
              </View>
            </View>
          </View>

          {/* Pasos */}
          <View style={[styles.stepsGrid, isWide && styles.stepsGridWide]}>
            {STEPS.map(st => (
              <View key={st.n} style={[styles.stepCard, isWide && { flex: 1 }]}>
                <View style={styles.stepHead}>
                  <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{st.n}</Text>
                  </LinearGradient>
                  <View style={styles.stepIcon}>
                    <Ionicons name={st.icon} size={21} color={D.purple} />
                  </View>
                </View>
                <Text style={styles.stepTitle}>{st.title}</Text>
                <Text style={styles.stepDesc}>{st.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <PublicFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.white },
  heroBg: { width: '100%' },
  heroInner: { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 52, alignItems: 'center' },
  heroTitle: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.6, marginBottom: 14 },
  heroTitleWide: { fontSize: 44, lineHeight: 49 },
  heroSub: { fontSize: 17, lineHeight: 27, color: D.body, textAlign: 'center', maxWidth: 580, marginBottom: 28 },
  heroActions: { flexDirection: 'row', gap: 14 },
  primaryBtnWrap: { borderRadius: 12, overflow: 'hidden' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, paddingHorizontal: 26 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: D.white },
  ghostBtn: { alignItems: 'center', justifyContent: 'center', height: 52, paddingHorizontal: 26, borderRadius: 12, borderWidth: 1.5, borderColor: D.borderSoft, backgroundColor: D.white },
  ghostBtnText: { fontSize: 15, fontWeight: '700', color: D.purple },

  section: { maxWidth: 1120, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  demoGrid: { gap: 22 },
  demoGridWide: { flexDirection: 'row' },
  demoCard: { borderWidth: 1, borderColor: D.lilacBorder, borderRadius: 20, backgroundColor: D.white, padding: 22 },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 18 },
  demoHeadIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center' },
  demoHeadText: { fontSize: 17, fontWeight: '800', color: D.ink },
  camBox: {
    borderRadius: 16, backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.lilacBorder,
    aspectRatio: 16 / 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 16,
  },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: D.violet },
  cornerTL: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 5 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 5 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 5 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 5 },
  camIcon: { width: 78, height: 78, borderRadius: 20, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  camTitle: { fontSize: 17, fontWeight: '700', color: D.ink, textAlign: 'center' },
  camSub: { fontSize: 14, color: D.hint, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  transBox: { borderRadius: 16, backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.lilacBorder, padding: 22, minHeight: 150, justifyContent: 'center' },
  transText: { fontSize: 26, fontWeight: '700', color: D.ink, lineHeight: 36 },
  transSub: { fontSize: 14, color: D.hint, fontWeight: '600', marginTop: 10 },

  stepsGrid: { gap: 20, marginTop: 26 },
  stepsGridWide: { flexDirection: 'row' },
  stepCard: { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, borderRadius: 18, padding: 24 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  stepNum: { width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 17, fontWeight: '800', color: D.white },
  stepIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '800', color: D.ink, marginBottom: 7 },
  stepDesc: { fontSize: 14, lineHeight: 22, color: D.body },
});
