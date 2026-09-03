
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';
import { useLoginForm } from '../hooks/useLoginForm';
import { useScrollToInput } from '../../../shared/hooks/useScrollToInput';
import { googleIcon, facebookIcon } from '../../../assets/icons/socialIcons';
import { useTranslation } from '../../../app/config/i18n';
import { HoverShadow, HoverShadowSoft } from '../../../shared/constants/hoverStyles';

const HERO_STATS = [
  { value: '+1000', label: 'Señas' },
  { value: '26', label: 'Letras LSC' },
  { value: '100%', label: 'Gratis' },
];

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { email, setEmail, handleEmailBlur, emailValid, password, setPassword, loading, errors, handleLogin } = useLoginForm();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const { scrollRef, handleInputFocus } = useScrollToInput();

  // El boton de volver solo tiene sentido en web: en movil Login es la raiz del stack
  // (AuthNavigator no registra Landing ni las demos) y goBack() no haria nada.
  const showBack = Platform.OS === 'web';

  const BackButton = (
    <Pressable
      style={({ hovered }: any) => [styles.backBtn, hovered && styles.backBtnHover]}
      onPress={() => navigation.goBack()}
    >
      <Ionicons name="arrow-back" size={22} color={D.purpleDark} />
    </Pressable>
  );

  const Form = (
    <View style={[styles.card, isWide && styles.cardWide]}>
      <View style={styles.avatarBox}>
        <Ionicons name="person-outline" size={28} color={D.purple} />
      </View>
      <Text style={styles.cardTitle}>Bienvenido de nuevo</Text>
      <Text style={styles.cardSubtitle}>Ingresa a tu cuenta para continuar</Text>

      <Text style={styles.label}>Email</Text>
      <View style={[styles.field, { borderColor: errors.email ? '#F0A9A9' : '#E3DBF7' }]}>
        <Ionicons name="mail-outline" size={19} color={D.purple} />
        <TextInput
          style={[styles.input, { outlineStyle: 'none' } as any]}
          value={email}
          onChangeText={setEmail}
          onBlur={handleEmailBlur}
          keyboardType="email-address"
          inputMode="email"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholder="tucorreo@ejemplo.com"
          placeholderTextColor="#A6A0B4"
        />
        {emailValid && <Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
      </View>
      {!!errors.email && (
        <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#EF4444" /><Text style={styles.errorText}>{errors.email}</Text></View>
      )}

      <Text style={styles.label}>Contraseña</Text>
      <View style={[styles.field, { borderColor: errors.password ? '#F0A9A9' : '#E3DBF7' }]}>
        <Ionicons name="lock-closed-outline" size={19} color={D.purple} />
        <TextInput
          style={[styles.input, { outlineStyle: 'none' } as any]}
          value={password}
          onChangeText={setPassword}
          onFocus={handleInputFocus}
          secureTextEntry={!showPw}
          textContentType="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••"
          placeholderTextColor="#A6A0B4"
        />
        <TouchableOpacity onPress={() => setShowPw(v => !v)}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color="#A6A0B4" />
        </TouchableOpacity>
      </View>
      {!!errors.password && (
        <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#EF4444" /><Text style={styles.errorText}>{errors.password}</Text></View>
      )}

      <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgotText}>{t('loginForgotPassword')}</Text>
      </TouchableOpacity>

      <View style={styles.btnRow}>
        <Pressable
          style={({ hovered }: any) => [styles.registerBtn, hovered && styles.registerBtnHover, hovered && HoverShadowSoft]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerBtnText}>{t('register')}</Text>
        </Pressable>
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ hovered }: any) => [
            styles.loginBtnWrap,
            hovered && !loading && styles.loginBtnWrapHover,
            loading && { opacity: 0.7 },
          ]}
        >
          <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>{loading ? t('loginSubmitLoading') : t('loginSubmitBtn')}</Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={({ hovered }: any) => [styles.socialBtn, hovered && styles.socialBtnHover, hovered && HoverShadowSoft]}>
          <Image source={googleIcon} style={styles.googleImg} resizeMode="contain" />
          <Text style={styles.socialText}>Google</Text>
        </Pressable>
        <Pressable style={({ hovered }: any) => [styles.socialBtn, hovered && styles.socialBtnHover, hovered && HoverShadowSoft]}>
          <Image source={facebookIcon} style={styles.fbImg} resizeMode="contain" />
          <Text style={styles.socialText}>Facebook</Text>
        </Pressable>
      </View>

      <Text style={styles.legalText}>
        {t('loginAcceptTerms')}{' '}
        <Text style={styles.legalLink} onPress={() => navigation.navigate('Terms')}>{t('loginTermsLink')}</Text>
        {' '}{t('loginAnd')}{' '}
        <Text style={styles.legalLink} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('loginPrivacyLink')}</Text>.
      </Text>
    </View>
  );

  const HeroPanel = (
    <LinearGradient colors={['#8B6FE0', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.hero}>
      <View style={styles.heroBlob1} />
      <View style={styles.heroBlob2} />
      <View style={styles.heroBrand}>
        <View style={styles.heroLogo}>
          <Image source={require('../../../assets/images/icono-senas.png')} style={styles.heroLogoImg} resizeMode="contain" />
        </View>
        <Text style={styles.heroBrandText}>TraduceSeña</Text>
      </View>
      <View>
        <View style={styles.heroPlate}>
          <Image source={require('../../../assets/images/login.png')} style={styles.heroPlateImg} resizeMode="cover" />
        </View>
        <Text style={styles.heroTitle}>Comunícate sin barreras</Text>
        <Text style={styles.heroSub}>Inicia sesión y continúa aprendiendo, traduciendo y conectando con la lengua de señas.</Text>
      </View>
      <View style={styles.heroStats}>
        {HERO_STATS.map(s => (
          <View key={s.label}>
            <Text style={styles.heroStatValue}>{s.value}</Text>
            <Text style={styles.heroStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {showBack && BackButton}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, !showBack && styles.scrollNoBack]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.layout, isWide && styles.layoutWide]}>
          {isWide && <View style={styles.heroCol}>{HeroPanel}</View>}
          <View style={[styles.formCol, isWide && styles.formColWide]}>{Form}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE7FB' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 84 },
  scrollNoBack: { paddingTop: 24 },
  layout: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  // 'stretch' iguala la altura de las dos columnas: el panel morado y la tarjeta
  // del formulario terminan midiendo lo mismo en escritorio.
  layoutWide: { maxWidth: 1080, flexDirection: 'row', gap: 40, alignItems: 'stretch' },
  heroCol: { flex: 1 },
  formCol: { width: '100%' },
  formColWide: { width: 420 },
  // En escritorio la tarjeta ocupa toda la altura de la columna para quedar
  // exactamente igual de alta que el panel morado de la izquierda.
  cardWide: { flex: 1, justifyContent: 'center' },

  backBtn: {
    position: 'absolute', top: 26, left: 26, zIndex: 20,
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7DEF8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  backBtnHover: { borderColor: D.purple, backgroundColor: D.lilacSoft, transform: [{ translateY: -2 }] },

  hero: { flex: 1, borderRadius: 26, overflow: 'hidden', padding: 38, gap: 8, minHeight: 560, justifyContent: 'space-between' },
  heroBlob1: { position: 'absolute', right: -40, top: -40, width: 260, height: 260, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  heroBlob2: { position: 'absolute', right: 60, bottom: -70, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  heroLogo: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  heroLogoImg: { width: 44, height: 44 },
  heroBrandText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroPlate: { borderRadius: 16, overflow: 'hidden', height: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 30, elevation: 8 },
  heroPlateImg: { width: '100%', height: '100%' },
  heroTitle: { fontSize: 30, lineHeight: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginTop: 18, marginBottom: 10 },
  heroSub: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.86)', maxWidth: 340 },
  heroStats: { flexDirection: 'row', gap: 22 },
  heroStatValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroStatLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

  card: { backgroundColor: '#fff', borderRadius: 26, padding: 30, shadowColor: '#1E143C', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.12, shadowRadius: 46, elevation: 8 },
  avatarBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: D.lilacSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.4, marginBottom: 5 },
  cardSubtitle: { fontSize: 14, fontWeight: '600', color: D.hint, textAlign: 'center', marginBottom: 20 },

  label: { fontSize: 13, fontWeight: '800', color: D.bodyLight, marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.cardBg, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 16, marginBottom: 14 },
  input: { flex: 1, fontSize: 15, color: D.ink },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 12 },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#EF4444' },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 22, marginTop: 2 },
  forgotText: { fontSize: 13, fontWeight: '700', color: D.purple },

  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  registerBtn: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: D.borderSoft, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  registerBtnHover: { borderColor: D.purple, backgroundColor: D.lilacSoft },
  registerBtnText: { fontSize: 15, fontWeight: '700', color: D.purple },
  loginBtnWrap: { flex: 1.3, borderRadius: 12, overflow: 'hidden' },
  loginBtnWrapHover: { ...HoverShadow, transform: [{ translateY: -2 }] },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52 },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: D.lilacBorder },
  dividerText: { fontSize: 12, fontWeight: '700', color: D.hintSoft },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: D.lilacBorder, backgroundColor: '#fff' },
  socialBtnHover: { borderColor: D.purple, backgroundColor: D.lilacSoft },
  socialText: { fontSize: 14, fontWeight: '700', color: D.bodyLight },
  googleImg: { width: 18, height: 18 },
  fbImg: { width: 26, height: 26, marginVertical: -4 },

  legalText: { fontSize: 12, lineHeight: 18, color: D.hint, textAlign: 'center' },
  legalLink: { fontWeight: '700', color: D.purple },
});
