import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { useColors } from '../../../app/providers/ThemeContext';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';

export interface AuthPalette {
  page: string;
  card: string;
  border: string;
  field: string;
  ink: string;
  sub: string;
  label: string;
  faint: string;
  accent: string;
  accentGrad: [string, string];
  iconBg: string;
}

/** Paleta para las pantallas de auth: diseño claro por defecto; respeta tema/acento cuando viene del Perfil. */
export function useAuthPalette(fromProfile: boolean, themed: ReturnType<typeof useColors>): AuthPalette {
  if (fromProfile) {
    return {
      page: themed.background,
      card: themed.surface,
      border: themed.border,
      field: themed.inputBg,
      ink: themed.textPrimary,
      sub: themed.textSecondary,
      label: themed.textSecondary,
      faint: themed.textHint,
      accent: themed.primary,
      accentGrad: themed.gradientPrimary,
      iconBg: themed.primaryBg,
    };
  }
  return {
    page: '#EDE7FB',
    card: '#FFFFFF',
    border: '#E3DBF7',
    field: D.cardBg,
    ink: D.ink,
    sub: D.hint,
    label: D.bodyLight,
    faint: D.hintSoft,
    accent: D.purple,
    accentGrad: [D.purpleBtn, D.purpleBtn2],
    iconBg: D.lilacSoft,
  };
}

interface Props {
  P: AuthPalette;
  step: 1 | 2 | 3;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const AuthStepCard: React.FC<Props> = ({ P, step, icon, title, subtitle, onBack, children }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPhone = width < 480;

  const backBtn = (
    <TouchableOpacity
      style={[isPhone ? styles.backBtnInline : styles.backBtn, { backgroundColor: P.card, borderColor: P.border }]}
      onPress={onBack}
    >
      <Ionicons name="arrow-back" size={22} color={P.accent} />
    </TouchableOpacity>
  );

  const stepper = (
    <View style={[styles.stepper, isPhone && styles.stepperInline]}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            { width: i === step ? 34 : 8, backgroundColor: i <= step ? P.accent : P.border },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.wrap, isPhone && styles.wrapPhone, isPhone && { paddingTop: insets.top }]}>
      {/* En movil el boton flotante quedaba sobre la barra de estado: aqui va en
          linea con el indicador de pasos, siempre por debajo del area segura. */}
      {isPhone ? (
        <View style={styles.topRow}>
          {backBtn}
          <View style={styles.topRowCenter}>{stepper}</View>
          <View style={styles.topRowSpacer} />
        </View>
      ) : (
        <>
          {backBtn}
          {stepper}
        </>
      )}

      {/* La tarjeta se centra en el espacio que queda bajo la fila superior. */}
      <View style={isPhone ? styles.cardCenter : undefined}>
        <View style={[styles.card, isPhone && styles.cardPhone, { backgroundColor: P.card, borderColor: P.border }]}>
          <View style={[styles.iconBox, isPhone && styles.iconBoxPhone, { backgroundColor: P.iconBg }]}>
            <Ionicons name={icon} size={isPhone ? 26 : 30} color={P.accent} />
          </View>
          <Text style={[styles.stepLabel, { color: P.faint }]}>Paso {step} de 3</Text>
          <Text style={[styles.title, isPhone && styles.titlePhone, { color: P.ink }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.subtitle, isPhone && styles.subtitlePhone, { color: P.sub }]}>{subtitle}</Text>}
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  wrapPhone: { flexGrow: 1 },
  cardCenter: { flexGrow: 1, justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: -62, left: 0, zIndex: 20,
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  backBtnInline: {
    width: 44, height: 44, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  // Separacion minima entre la fila de volver/pasos y la tarjeta.
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  topRowCenter: { flex: 1, alignItems: 'center' },
  topRowSpacer: { width: 44 },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 26 },
  stepperInline: { marginBottom: 0 },
  dot: { height: 8, borderRadius: 999 },
  card: { borderRadius: 26, padding: 36, borderWidth: 1, shadowColor: '#1E143C', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.12, shadowRadius: 46, elevation: 8 },
  cardPhone: { borderRadius: 20, padding: 20 },
  iconBox: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  iconBoxPhone: { width: 54, height: 54, borderRadius: 16, marginBottom: 12 },
  stepLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 },
  titlePhone: { fontSize: 20 },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center', marginBottom: 26 },
  subtitlePhone: { fontSize: 13.5, lineHeight: 20, marginBottom: 20 },
});
