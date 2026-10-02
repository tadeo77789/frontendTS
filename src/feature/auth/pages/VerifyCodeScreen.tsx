import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../../app/routes/AuthNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { AuthStepCard, useAuthPalette } from '../components/AuthStepCard';
import { useAuth } from '../../../app/providers/AuthContext';
import { normalizeApiError } from '../../../shared/services/api.client';
import { showError, showAlert, showSuccess } from '../../../shared/utils/dialogs';
import { verifyEmail, resendVerification } from '../services/auth.service';
import { pendingAuthFlow, RESEND_COOLDOWN_MS } from '../services/pendingAuthFlow';
import { useResendCooldown } from '../hooks/useResendCooldown';

const CODE_LENGTH = 6;
type NavigationProps = NativeStackNavigationProp<AuthStackParams>;

export const VerifyCodeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const params = route.params as { mode?: 'verify' | 'reset'; fromProfile?: boolean } | undefined;
  const fromProfile = params?.fromProfile ?? false;
  const isVerify = params?.mode === 'verify';
  const { login } = useAuth();
  // Correo/contraseña solo desde el almacén en memoria (nunca por params).
  const [flow, setFlow] = useState(() => (isVerify ? pendingAuthFlow.get() : null));
  const { seconds, canResend } = useResendCooldown(flow?.resendAvailableAt);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const busy = useRef(false);
  const themed = useColors();
  const P = useAuthPalette(fromProfile, themed);
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 480;

  // Sin datos pendientes (p. ej. recarga en web): volver a Login.
  useEffect(() => {
    if (isVerify && !flow) {
      navigation.navigate('Login');
      void showAlert({ message: t('verifyNoSession'), icon: 'info' });
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salir hacia atrás (botón, gesto o botón del sistema) descarta el estado pendiente.
  useEffect(() => {
    if (!isVerify) return undefined;
    return navigation.addListener('beforeRemove', () => pendingAuthFlow.clear());
  }, [isVerify, navigation]);

  const handleVerify = useCallback(async () => {
    const value = code.join('');
    if (value.length < CODE_LENGTH) { void showError(t('verifyErrorIncomplete'), t('error')); return; }
    if (busy.current) return;
    // Se lee en el momento del envio, no la copia del estado.
    const current = pendingAuthFlow.get();
    if (!current?.password) { navigation.navigate('Login'); void showAlert({ message: t('verifyNoSession'), icon: 'info' }); return; }
    busy.current = true;
    setLoading(true);
    try {
      await verifyEmail(current.email, value, current.password);
    } catch (error) {
      busy.current = false;
      setLoading(false);
      const { code: errCode } = normalizeApiError(error);
      const msg = errCode === 'NETWORK' ? t('loginNetworkError')
        : errCode === 'SERVER' ? t('serverUnavailable')
        : t('verifyInvalidCode');
      if (errCode === 'INVALID_CODE' || errCode === 'VALIDATION_ERROR') {
        setCode(Array(CODE_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
      void showError(msg, t('error'));
      return;
    }
    try {
      await login({ email: current.email, password: current.password });
      pendingAuthFlow.clear();
    } catch {
      // Correo ya confirmado pero el login falló: que inicie sesión a mano.
      pendingAuthFlow.clear();
      navigation.navigate('Login');
      void showSuccess(t('verifyConfirmedSignIn'));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [code, login, navigation, t]);

  const handleResend = useCallback(async () => {
    if (busy.current) return;
    if (!flow || !canResend || resending) return;
    busy.current = true;
    setResending(true);
    try {
      await resendVerification(flow.email);
    } catch (error) {
      const { code: errCode } = normalizeApiError(error);
      if (errCode === 'NETWORK' || errCode === 'SERVER') {
        // Fallo de red/servidor: sin cuenta atras, puede reintentar ya.
        void showError(errCode === 'NETWORK' ? t('loginNetworkError') : t('serverUnavailable'), t('error'));
        busy.current = false;
        setResending(false);
        return;
      }
      // Otros errores: mismo aviso generico (no se revela si el correo existe).
    }
    try {
      pendingAuthFlow.update({ resendAvailableAt: Date.now() + RESEND_COOLDOWN_MS });
      setFlow(pendingAuthFlow.get());
      void showAlert({ message: t('verifyResendDone'), icon: 'info' });
    } finally {
      busy.current = false;
      setResending(false);
    }
  }, [flow, canResend, resending, t]);

  const handleVerifyChange = (index: number, text: string) => {
    if (text === '') {
      const cleared = [...code];
      cleared[index] = '';
      setCode(cleared);
      return;
    }
    let digits = text.replace(/\D/g, '');
    if (digits.length === 0) return;
    const prev = code[index];
    // Casilla ya ocupada: descartar el digito previo que reaparece en el texto.
    if (prev && (digits.length === 2 || digits.length === CODE_LENGTH + 1)) {
      if (digits.startsWith(prev)) digits = digits.slice(1);
      else if (digits.endsWith(prev)) digits = digits.slice(0, -1);
    }
    if (digits.length >= CODE_LENGTH) {
      setCode(digits.slice(0, CODE_LENGTH).split(''));
      inputs.current[CODE_LENGTH - 1]?.focus();
      return;
    }
    const newCode = [...code];
    if (digits.length === 1) {
      newCode[index] = digits;
      setCode(newCode);
      if (index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
      return;
    }
    // 2 a 5 digitos: repartir desde la casilla actual.
    let last = index;
    digits.split('').forEach((d, k) => {
      if (index + k < CODE_LENGTH) { newCode[index + k] = d; last = index + k; }
    });
    setCode(newCode);
    inputs.current[Math.min(last + 1, CODE_LENGTH - 1)]?.focus();
  };

  const handleChange = (text: string, index: number) => {
    if (isVerify) { handleVerifyChange(index, text); return; }
    const digit = text.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleConfirm = () => {
    if (code.join('').length < CODE_LENGTH) { Alert.alert(t('error'), t('verifyErrorIncomplete')); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); navigation.navigate('NewPassword', { fromProfile }); }, 1000);
  };

  const verifyResendBlock = (
    <View style={styles.resendBox}>
      <Text style={[styles.resend, { color: P.faint, marginBottom: 0 }]}>{t('verifyResend')}</Text>
      <TouchableOpacity
        onPress={handleResend}
        disabled={!canResend || resending}
        hitSlop={8}
        style={styles.resendBtn}
        accessibilityRole="button"
        accessibilityLabel={t('verifyResendLabel')}
        accessibilityHint={canResend ? undefined : t('verifyResendHint', { n: seconds })}
        accessibilityState={{ disabled: !canResend || resending }}
      >
        <Text style={[styles.resendLink, { color: canResend ? P.accent : P.faint }]}>
          {canResend ? t('verifyResendLink') : t('verifyResendIn', { n: seconds })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: P.page }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthStepCard
          P={P}
          step={2}
          icon="shield-checkmark-outline"
          title={isVerify ? t('verifyEmailTitle') : t('verifyTitle')}
          subtitle={isVerify ? t('verifyEmailSubtitle', { email: flow?.email ?? '' }) : t('verifySubtitle')}
          onBack={() => { if (isVerify) pendingAuthFlow.clear(); navigation.goBack(); }}
        >
          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { if (el) inputs.current[i] = el; }}
                style={[
                  styles.otpInput,
                  { backgroundColor: P.field, borderColor: digit ? P.accent : P.border, color: P.ink },
                  { outlineStyle: 'none' } as any,
                ]}
                value={digit}
                onChangeText={text => handleChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={isVerify ? 12 : 1}
                {...(isVerify ? {
                  accessibilityLabel: t('verifyDigitLabel', { n: i + 1 }),
                  textContentType: 'oneTimeCode' as const,
                  autoComplete: 'one-time-code' as const,
                } : {})}
                textAlign="center"
              />
            ))}
          </View>

          {isVerify ? verifyResendBlock : (
          <Text style={[styles.resend, { color: P.faint }]}>
            {t('verifyResend')}{' '}
            <Text style={[styles.resendLink, { color: P.accent }]} onPress={() => {}}>{t('verifyResendLink')}</Text>
          </Text>
          )}

          <TouchableOpacity activeOpacity={0.9} onPress={isVerify ? handleVerify : handleConfirm} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} style={[styles.btnWrap, loading && { opacity: 0.7 }]}>
            <LinearGradient colors={P.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? t('verifyBtnLoading') : t('verifyBtn')}</Text>
              {!loading && <Ionicons name="arrow-forward" size={17} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </AuthStepCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 88 },
  // En movil el boton de volver va en linea dentro de la tarjeta, asi que ya no
  // hace falta reservar espacio arriba.
  scrollPhone: { padding: 16, paddingTop: 16, justifyContent: 'flex-start'},
  otpRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  // minWidth: 0 es imprescindible en web: react-native-web no resetea min-width en
  // TextInput (si lo hace en View), asi que el input conserva su ancho intrinseco
  // de ~170px, no encoge, y las 6 casillas se desbordan de la tarjeta.
  otpInput: { flex: 1, minWidth: 0, aspectRatio: 1 / 1.15, borderWidth: 1.5, borderRadius: 12, fontSize: 22, fontWeight: '800', textAlign: 'center', paddingVertical: 0 },
  resend: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  resendBox: { alignItems: 'center', gap: 4, marginBottom: 20 },
  resendBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  resendLink: { fontWeight: '800' },
  btnWrap: { borderRadius: 12, overflow: 'hidden' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
