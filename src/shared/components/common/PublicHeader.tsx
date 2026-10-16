import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LandingTheme as D, PublicSection } from '../../constants/landingTheme';
import { HoverShadow, HoverShadowSoft } from '../../constants/hoverStyles';
import { useHover } from '../../hooks/useHover';

const NAV_ITEMS: { key: PublicSection; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'inicio',    label: 'Inicio',    icon: 'home',     route: 'Landing' },
  { key: 'traductor', label: 'Traductor', icon: 'language', route: 'TraductorDemo' },
  { key: 'alfabeto',  label: 'Alfabeto',  icon: 'text',     route: 'AlfabetoDemo' },
  { key: 'nosotros',  label: 'Nosotros',  icon: 'people',   route: 'Nosotros' },
];

interface Props {
  active: PublicSection;
}

// Item del nav con realce al pasar el cursor (web). En movil el hover nunca se activa.
const NavItem: React.FC<{
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onPress: () => void;
}> = ({ item, active, onPress }) => {
  const { hovered, hoverProps } = useHover();
  const highlight = active || hovered;

  return (
    <Pressable style={styles.navItem} onPress={onPress} {...hoverProps}>
      {highlight && <Ionicons name={item.icon} size={16} color={D.purple} />}
      <Text style={[styles.navText, highlight && styles.navTextActive]}>{item.label}</Text>
      {highlight && <View style={[styles.navUnderline, !active && styles.navUnderlineHover]} />}
    </Pressable>
  );
};

export const PublicHeader: React.FC<Props> = ({ active }) => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMid = width >= 640;

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.brand} activeOpacity={0.8} onPress={() => navigation.navigate('Landing')}>
          <View style={styles.brandLogo}>
            <Image
              source={require('../../../assets/images/icono-senas.png')}
              style={styles.brandLogoImg}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.brandName}>TraduceSeña</Text>
            <Text style={styles.brandTagline}>Lengua de señas para todos</Text>
          </View>
        </TouchableOpacity>

        {isWide && (
          <View style={styles.nav}>
            {NAV_ITEMS.map(item => (
              <NavItem
                key={item.key}
                item={item}
                active={item.key === active}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ hovered }: any) => [
              styles.loginBtn,
              hovered && styles.loginBtnHover,
              hovered && HoverShadowSoft,
            ]}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="person-outline" size={17} color={D.purple} />
            {isMid && <Text style={styles.loginBtnText}>Iniciar sesión</Text>}
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Register')}
            style={({ hovered }: any) => [styles.registerWrap, hovered && styles.registerWrapHover]}
          >
            <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.registerBtn}>
              <Text style={styles.registerBtnText}>Registrarse</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: D.lilacLine,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 20,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandLogo: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brandLogoImg: { width: 38, height: 38 },
  brandName: { fontSize: 20, fontWeight: '800', color: D.ink, letterSpacing: -0.3 },
  brandTagline: { fontSize: 11, color: D.hint, fontWeight: '600', marginTop: 3 },

  nav: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingBottom: 4 },
  navText: { fontSize: 15, fontWeight: '600', color: D.bodyLight },
  navTextActive: { color: D.purple, fontWeight: '700' },
  navUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: D.purple, borderRadius: 2 },
  navUnderlineHover: { opacity: 0.45 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 44, paddingHorizontal: 18, borderRadius: 999,
    borderWidth: 1.5, borderColor: D.border, backgroundColor: 'transparent',
  },
  loginBtnHover: { borderColor: D.purple, backgroundColor: D.lilacBg },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: D.purple },
  registerWrap: {
    borderRadius: 999, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.24, shadowRadius: 12, elevation: 6,
  },
  registerWrapHover: { ...HoverShadow, transform: [{ translateY: -2 }] },
  registerBtn: { height: 44, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { fontSize: 15, fontWeight: '700', color: D.white },
});
