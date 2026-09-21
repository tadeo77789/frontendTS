
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { useScrollToInput } from '../../../shared/hooks/useScrollToInput';
import { useTranslation } from '../../../app/config/i18n';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { form, setField, loading, errors, handleRegister } = useRegisterForm();
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const { scrollRef, handleInputFocus } = useScrollToInput();
  // El boton flota sobre el scroll: sin el area segura se monta en la barra de
  // estado del movil. En web el inset es 0 y se queda donde estaba.
  const insets = useSafeAreaInsets();
  const backTop = insets.top + 26;

  const pw = form.password;
  const reqs = [
    { label: 'Al menos 8 caracteres', ok: pw.length >= 8 },
    { label: 'Mayúscula y minúscula', ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
    { label: 'Al menos un número', ok: /\d/.test(pw) },
    { label: 'Un carácter especial (!@#$…)', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = reqs.filter(r => r.ok).length;
  const strengthMeta = [
    { color: '#E3DBF7', label: '' },
    { color: '#EF4444', label: 'Débil' },
    { color: '#F59E0B', label: 'Regular' },
    { color: '#F59E0B', label: 'Buena' },
    { color: '#10B981', label: 'Fuerte' },
  ][score];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={[styles.backBtn, { top: backTop }]} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={D.purpleDark} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.avatarBox}>
            <Ionicons name="person-add-outline" size={30} color={D.purple} />
          </View>
          <Text style={styles.title}>{t('registerTitle')}</Text>
          <Text style={styles.subtitle}>Únete y empieza a comunicarte sin barreras</Text>

          {/* Nombre */}
          <Text style={styles.label}>{t('registerNameLabel')}</Text>
          <View style={[styles.field, { borderColor: errors.nombre ? '#F0A9A9' : '#E3DBF7' }]}>
            <Ionicons name="person-outline" size={19} color={D.purple} />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              value={form.nombre}
              onChangeText={v => setField('nombre', v)}
              placeholder={t('registerNamePlaceholder')}
              placeholderTextColor="#A6A0B4"
            />
          </View>
          {!!errors.nombre && <ErrorLine text={errors.nombre} />}

          {/* Email */}
          <Text style={styles.label}>{t('email')}</Text>
          <View style={[styles.field, { borderColor: errors.correo ? '#F0A9A9' : '#E3DBF7' }]}>
            <Ionicons name="mail-outline" size={19} color={D.purple} />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              value={form.correo}
              onChangeText={v => setField('correo', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t('registerEmailPlaceholder')}
              placeholderTextColor="#A6A0B4"
            />
          </View>
          {!!errors.correo && <ErrorLine text={errors.correo} />}

          {/* Contraseña */}
          <Text style={styles.label}>{t('password')}</Text>
          <View style={[styles.field, { borderColor: errors.password ? '#F0A9A9' : '#E3DBF7', marginBottom: 12 }]}>
            <Ionicons name="lock-closed-outline" size={19} color={D.purple} />
            <TextInput
              style={[styles.input, { outlineStyle: 'none' } as any]}
              value={form.password}
              onChangeText={v => setField('password', v)}
              onFocus={handleInputFocus}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#A6A0B4"
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color="#A6A0B4" />
            </TouchableOpacity>
          </View>

          {/* Fuerza */}
          <View style={styles.strengthRow}>
            <View style={styles.strengthBars}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.strengthBar, { backgroundColor: i < score ? strengthMeta.color : '#E3DBF7' }]} />
              ))}
            </View>
            {!!pw && <Text style={[styles.strengthLabel, { color: strengthMeta.color }]}>{strengthMeta.label}</Text>}
          </View>

          {/* Requisitos */}
          <View style={styles.reqs}>
            {reqs.map(r => (
              <View key={r.label} style={styles.reqRow}>
                <Ionicons
                  name={r.ok ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={r.ok ? '#10B981' : D.border}
                />
                <Text style={styles.reqText}>{r.label}</Text>
              </View>
            ))}
          </View>
          {!!errors.password && <ErrorLine text={errors.password} />}

          {/* Términos */}
          <TouchableOpacity style={styles.termsRow} activeOpacity={0.8} onPress={() => setField('terminos', !form.terminos)}>
            {form.terminos ? (
              <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} style={styles.checkbox}>
                <Ionicons name="checkmark" size={15} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.checkbox, styles.checkboxEmpty]} />
            )}
            <Text style={styles.termsText}>
              {t('registerTerms')}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>{t('registerTermsLink')}</Text>
              {t('registerTermsEnd')}
            </Text>
          </TouchableOpacity>
          {!!errors.terminos && <ErrorLine text={errors.terminos} />}

          <TouchableOpacity activeOpacity={0.9} onPress={handleRegister} disabled={loading} style={[styles.submitWrap, loading && { opacity: 0.7 }]}>
            <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submit}>
              <Text style={styles.submitText}>{loading ? t('registerBtnLoading') : t('registerBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.loginRow}>
            {t('registerHasAccount')}{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>{t('registerLoginLink')}</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const ErrorLine: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.errorRow}>
    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
    <Text style={styles.errorText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE7FB' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 88 },
  // top lo fija la pantalla sumando el area segura.
  backBtn: {
    position: 'absolute', top: 26, left: 26, zIndex: 20,
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7DEF8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },

  card: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 26, padding: 34, shadowColor: '#1E143C', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.12, shadowRadius: 46, elevation: 8 },
  avatarBox: { width: 66, height: 66, borderRadius: 20, backgroundColor: D.lilacSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '600', color: D.hint, textAlign: 'center', marginBottom: 26 },

  label: { fontSize: 13, fontWeight: '800', color: D.bodyLight, marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.cardBg, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 15, color: D.ink },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -10, marginBottom: 12 },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#EF4444' },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 5 },
  strengthBar: { flex: 1, height: 6, borderRadius: 999 },
  strengthLabel: { fontSize: 12, fontWeight: '800' },

  reqs: { gap: 8, marginBottom: 20 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reqText: { fontSize: 13, fontWeight: '600', color: D.body },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 24 },
  checkbox: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxEmpty: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: D.borderSoft },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20, color: D.body },
  termsLink: { fontWeight: '700', color: D.purple },

  submitWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  submit: { alignItems: 'center', justifyContent: 'center', height: 54 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  loginRow: { fontSize: 14, fontWeight: '600', color: D.body, textAlign: 'center' },
  loginLink: { fontWeight: '800', color: D.purple },
});
