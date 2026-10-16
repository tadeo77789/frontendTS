import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuthStepCard, useAuthPalette } from '../components/AuthStepCard';
import { useAuth } from '../../../app/providers/AuthContext';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { api, normalizeApiError } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import { showAlert, showError } from '../../../shared/utils/dialogs';
import {
  evaluatePassword, MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH, passwordByteLength,
} from '../../../shared/utils/passwordStrength';
import { useScrollToInput } from '../../../shared/hooks/useScrollToInput';
import { changePassword, forgotPassword, resetPassword } from '../services/auth.service';

type Errors = { current?: string; code?: string; password?: string; confirm?: string };

/** Mismo intervalo que exige el backend entre envios de codigo. */
const RESEND_COOLDOWN_S = 60;

export function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();
  const themed = useColors();
  const P = useAuthPalette(true, themed);
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 480;
  const { scrollRef, handleInputFocus } = useScrollToInput();

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // Cuentas creadas con Google no tienen contraseña: en vez de pedir la actual se crea una con un
  // codigo enviado al correo (mismos endpoints que "olvide mi contraseña"). null = aun no se sabe.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let active = true;
    api.get(ENDPOINTS.me)
      .then(({ data }) => {
        // Un backend sin has_password se trata como cuenta con contraseña (comportamiento anterior).
        if (active) setHasPassword(data?.data?.has_password !== false);
      })
      .catch(() => { if (active) setHasPassword(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const createMode = hasPassword === false;
  const email = user?.email ?? '';

  const handleSendCode = async () => {
    if (sending || cooldown > 0 || !email) return;
    setSending(true);
    try {
      await forgotPassword(email);
    } catch (error) {
      setSending(false);
      const { code: apiCode } = normalizeApiError(error);
      void showError(apiCode === 'NETWORK' ? t('loginNetworkError')
        : apiCode === 'SERVER' ? t('serverUnavailable') : t('accountActionError'), t('error'));
      return;
    }
    setSending(false);
    setCodeSent(true);
    setCooldown(RESEND_COOLDOWN_S);
    void showAlert({ message: t('changePwCodeSent', { email }), icon: 'info' });
  };

  const { checks } = evaluatePassword(password);
  const reqs = [
    { key: 'pwCheckLength', label: t('pwCheckLength'), ok: checks.length },
    { key: 'pwCheckCase', label: t('pwCheckCase'), ok: checks.upper && checks.lower },
    { key: 'pwCheckNumber', label: t('pwCheckNumber'), ok: checks.number },
    { key: 'pwCheckSpecial', label: t('pwCheckSpecial'), ok: checks.special },
  ];
  // El servidor exige las cuatro reglas (mayúscula, minúscula, número y símbolo).
  const meetsAll = checks.length && checks.upper && checks.lower && checks.number && checks.special;

  const handleConfirm = async () => {
    if (loading) return;
    const e: Errors = {};
    if (createMode) {
      if (!/^\d{6}$/.test(code)) e.code = t('changePwCodeRequired');
    } else if (!current) e.current = t('changePwCurrentRequired');
    if (!password || password.length < MIN_PASSWORD_LENGTH) e.password = t('newPasswordErrorShort');
    else if (passwordByteLength(password) > MAX_PASSWORD_BYTES) e.password = t('passwordTooLong');
    else if (!meetsAll) e.password = t('registerPasswordWeak');
    else if (!createMode && password === current) e.password = t('changePwSameAsCurrent');
    if (!confirm || password !== confirm) e.confirm = t('newPasswordErrorMismatch');
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      if (createMode) await resetPassword(email, code, password);
      else await changePassword(current, password);
    } catch (error) {
      setLoading(false);
      const { code: apiCode } = normalizeApiError(error);
      if (apiCode === 'INVALID_PASSWORD') setErrors({ current: t('changePwInvalidPassword') });
      else if (apiCode === 'INVALID_CODE') setErrors({ code: t('changePwCodeInvalid') });
      else if (apiCode === 'VALIDATION_ERROR') setErrors({ password: t('registerPasswordWeak') });
      else {
        const msg = apiCode === 'NETWORK' ? t('loginNetworkError')
          : apiCode === 'SERVER' ? t('serverUnavailable')
          : t('accountActionError');
        void showError(msg, t('error'));
      }
      return;
    }
    // La contraseña cambió: cerrar sesión (vuelve al login) y avisar.
    await logout();
    void showAlert({ message: t(createMode ? 'changePwCreated' : 'changePwDone'), icon: 'success' });
  };

  const field = (
    label: string, value: string, set: (v: string) => void, show: boolean, toggle: () => void,
    placeholder: string, err: string | undefined, key: keyof Errors, auto: 'current-password' | 'new-password',
  ) => (
    <>
      <Text style={[styles.label, { color: P.label }]}>{label}</Text>
      <View style={[styles.field, { backgroundColor: P.field, borderColor: err ? '#F0A9A9' : P.border }]}>
        <Ionicons name="lock-closed-outline" size={19} color={P.accent} />
        <TextInput
          style={[styles.input, { color: P.ink }, { outlineStyle: 'none' } as any]}
          value={value}
          onChangeText={v => { set(v); setErrors(prev => ({ ...prev, [key]: undefined })); }}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={auto === 'current-password' ? 'password' : 'newPassword'}
          autoComplete={auto}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          placeholderTextColor="#A6A0B4"
        />
        <TouchableOpacity onPress={toggle}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color="#A6A0B4" />
        </TouchableOpacity>
      </View>
      {!!err && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{err}</Text>
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: P.page }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <AuthStepCard
          P={P}
          step={1}
          icon="key-outline"
          title={t(createMode ? 'changePwCreateTitle' : 'changePwTitle')}
          subtitle={t(createMode ? 'changePwCreateSubtitle' : 'changePwSubtitle')}
          onBack={() => navigation.goBack()}
        >
          {createMode ? (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendCode}
                disabled={sending || cooldown > 0}
                accessibilityRole="button"
                style={[styles.sendBtn, { borderColor: P.accent }, (sending || cooldown > 0) && { opacity: 0.6 }]}
              >
                <Ionicons name="mail-outline" size={18} color={P.accent} />
                <Text style={[styles.sendBtnText, { color: P.accent }]}>
                  {cooldown > 0 ? t('changePwResendIn', { seconds: cooldown })
                    : codeSent ? t('changePwResendCode') : t('changePwSendCode')}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.label, { color: P.label }]}>{t('changePwCodeLabel')}</Text>
              <View style={[styles.field, { backgroundColor: P.field, borderColor: errors.code ? '#F0A9A9' : P.border }]}>
                <Ionicons name="keypad-outline" size={19} color={P.accent} />
                <TextInput
                  style={[styles.input, { color: P.ink }, { outlineStyle: 'none' } as any]}
                  value={code}
                  onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setErrors(prev => ({ ...prev, code: undefined })); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  onFocus={handleInputFocus}
                  placeholder={t('changePwCodePlaceholder')}
                  placeholderTextColor="#A6A0B4"
                />
              </View>
              {!!errors.code && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.code}</Text>
                </View>
              )}
            </>
          ) : field(t('changePwCurrentLabel'), current, setCurrent, showCurrent, () => setShowCurrent(v => !v),
            t('changePwCurrentPlaceholder'), errors.current, 'current', 'current-password')}
          {field(t('newPasswordNewLabel'), password, setPassword, showPw, () => setShowPw(v => !v),
            t('newPasswordNewPlaceholder'), errors.password, 'password', 'new-password')}

          <View style={[styles.reqs, isPhone && styles.reqsPhone]}>
            {reqs.map(r => (
              <View key={r.key} style={styles.reqRow}>
                <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? '#10B981' : P.border} />
                <Text style={[styles.reqText, { color: P.sub }]}>{r.label}</Text>
              </View>
            ))}
          </View>

          {field(t('newPasswordConfirmLabel'), confirm, setConfirm, showPw2, () => setShowPw2(v => !v),
            t('newPasswordConfirmPlaceholder'), errors.confirm, 'confirm', 'new-password')}

          <TouchableOpacity activeOpacity={0.9} onPress={handleConfirm} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} style={[styles.btnWrap, loading && { opacity: 0.7 }]}>
            <LinearGradient colors={P.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? t('newPasswordBtnLoading') : t(createMode ? 'changePwCreateBtn' : 'changePwBtn')}</Text>
              {!loading && <Ionicons name="checkmark" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </AuthStepCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 88 },
  scrollPhone: { padding: 16, paddingTop: 16, justifyContent: 'flex-start' },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 16, marginBottom: 14 },
  input: { flex: 1, fontSize: 15 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, height: 46, marginBottom: 16 },
  sendBtnText: { fontSize: 14, fontWeight: '800' },
  reqs: { gap: 8, marginBottom: 18 },
  reqsPhone: { gap: 6, marginBottom: 14 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reqText: { fontSize: 13, fontWeight: '600', flex: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 12 },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#EF4444', flex: 1 },
  btnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
