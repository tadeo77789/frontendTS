import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicHeader } from '../../../shared/components/common/PublicHeader';
import { PublicFooter } from '../../../shared/components/common/PublicFooter';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';

const PILLARS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; color: string; bg: string }[] = [
  { icon: 'flag-outline', title: 'Nuestra misión', desc: 'Hacer la LSC accesible para todos con herramientas simples y gratuitas.', color: D.purple, bg: D.lilacBg },
  { icon: 'heart-outline', title: 'Por qué lo hacemos', desc: 'Creemos que nadie debería quedar fuera de una conversación.', color: D.green, bg: D.greenBg },
  { icon: 'rocket-outline', title: 'Cómo trabajamos', desc: 'Diseño, código y comunidad — iterando desde Neiva para todo el país.', color: D.amber, bg: D.amberBg },
];

const TEAM: { name: string; role: string; icon: keyof typeof Ionicons.glyphMap; bio: string; tint: string; color: string }[] = [
  { name: 'Nombre Apellido', role: 'Desarrollo', icon: 'code-slash', bio: 'Construye la app y el modelo de reconocimiento de señas.', tint: D.lilacSoft, color: D.violet },
  { name: 'Nombre Apellido', role: 'Diseño', icon: 'color-palette', bio: 'Diseña la experiencia y la identidad visual del producto.', tint: D.greenBg, color: D.green },
  { name: 'Nombre Apellido', role: 'Contenido LSC', icon: 'hand-left', bio: 'Cura las señas y valida que todo sea fiel a la LSC.', tint: D.amberBg, color: D.amber },
];

const STATS = [
  { value: '3', label: 'Integrantes' },
  { value: 'Neiva', label: 'Nuestra base' },
  { value: '26', label: 'Letras LSC' },
  { value: '100%', label: 'Pasión' },
];

export const NosotrosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
              <Text style={styles.pillText}>Neiva, Huila · Colombia</Text>
            </View>
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
              Somos un equipo de <Text style={{ color: D.purple }}>tres</Text> creando comunicación sin barreras
            </Text>
            <Text style={styles.heroSub}>
              Tres estudiantes de Neiva que unimos tecnología e inclusión para acercar la Lengua de Señas
              Colombiana a más personas.
            </Text>
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
                  <Text style={styles.pillarTitle}>{p.title}</Text>
                  <Text style={styles.pillarDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Equipo */}
        <View style={styles.section}>
          <Text style={styles.h2}>El equipo</Text>
          <Text style={styles.h2Sub}>Tres personas, un mismo propósito</Text>
          <View style={[styles.teamGrid, isMid && styles.teamGridWide]}>
            {TEAM.map((t, i) => (
              <View key={i} style={[styles.teamCard, isMid && { flex: 1 }]}>
                <View style={[styles.avatar, { backgroundColor: t.tint }]}>
                  <Ionicons name={t.icon} size={44} color={t.color} />
                </View>
                <Text style={styles.teamName}>{t.name}</Text>
                <View style={[styles.rolePill, { backgroundColor: t.tint }]}>
                  <Ionicons name={t.icon} size={14} color={t.color} />
                  <Text style={[styles.roleText, { color: t.color }]}>{t.role}</Text>
                </View>
                <Text style={styles.teamBio}>{t.bio}</Text>
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
                <Text style={styles.pillText}>Hechos en Neiva</Text>
              </View>
              <Text style={styles.bannerTitle}>Desde el Huila para toda Colombia</Text>
              <Text style={styles.bannerText}>
                Somos un proyecto joven, hecho con esfuerzo local. Si quieres apoyarnos, colaborar o dar
                retroalimentación, escríbenos — nos encantará saber de ti.
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Register')} style={styles.bannerBtnWrap}>
                <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Conócenos</Text>
                  <Ionicons name="arrow-forward" size={18} color={D.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={[styles.statsGrid, isWide && { flex: 0.8 }]}>
              {STATS.map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
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
