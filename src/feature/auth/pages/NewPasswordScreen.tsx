
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { AuthStepCard, useAuthPalette } from '../components/AuthStepCard';
import { evaluatePassword, MIN_PASSWORD_LENGTH } from '../../../shared/utils/passwordStrength';
import { useScrollToInput } from '../../../shared/hooks/useScrollToInput';

export const NewPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const fromProfile = (route.params as any)?.fromProfile ?? false;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const themed = useColors();
  const P = useAuthPalette(fromProfile, themed);
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 480;
  const { scrollRef, handleInputFocus } = useScrollToInput();

  const { checks, meetsMinimum } = evaluatePassword(password);
  const reqs = [
    { key: 'pwCheckLength',  label: t('pwCheckLength'),  ok: checks.length },
    { key: 'pwCheckCase',    label: t('pwCheckCase'),    ok: checks.upper && checks.lower },
    { key: 'pwCheckNumber',  label: t('pwCheckNumber'),  ok: checks.number },
    { key: 'pwCheckSpecial', label: t('pwCheckSpecial'), ok: checks.special },
  ];

  const handleConfirm = () => {
    const e: { password?: string; confirm?: string } = {};
    if (!password || password.length < MIN_PASSWORD_LENGTH) e.password = t('newPasswordErrorShort');
    else if (!meetsMinimum) e.password = t('registerPasswordWeak');
    if (!confirm || password !== confirm) e.confirm = t('newPasswordErrorMismatch');
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (fromProfile) navigation.popToTop();
      else navigation.navigate('Login');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: P.page }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <AuthStepCard
          P={P}
          step={3}
          icon="key-outline"
          title={t('newPasswordTitle')}
          subtitle={t('newPasswordHint')}
          onBack={() => navigation.goBack()}
        >
          <Text style={[styles.label, { color: P.label }]}>{t('newPasswordNewLabel')}</Text>
          <View style={[styles.field, { backgroundColor: P.field, borderColor: errors.password ? '#F0A9A9' : P.border }]}>
            <Ionicons name="lock-closed-outline" size={19} color={P.accent} />
            <TextInput
              style={[styles.input, { color: P.ink }, { outlineStyle: 'none' } as any]}
              value={password}
              onChangeText={v => { setPassword(v); setErrors(prev => ({ ...prev, password: undefined })); }}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              onFocus={handleInputFocus}
              placeholder={t('newPasswordNewPlaceholder')}
              placeholderTextColor="#A6A0B4"
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={19} color="#A6A0B4" />
            </TouchableOpacity>
          </View>
          {!!errors.password && (
            <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#EF4444" /><Text style={styles.errorText}>{errors.password}</Text></View>
          )}

          <View style={[styles.reqs, isPhone && styles.reqsPhone]}>
            {reqs.map(r => (
              <View key={r.key} style={[styles.reqRow, isPhone && styles.reqRowPhone]}>
                <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? '#10B981' : P.border} />
                <Text style={[styles.reqText, { color: P.sub }]}>{r.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.label, { color: P.label }]}>{t('newPasswordConfirmLabel')}</Text>
          <View style={[styles.field, { backgroundColor: P.field, borderColor: errors.confirm ? '#F0A9A9' : P.border }]}>
            <Ionicons name="lock-closed-outline" size={19} color={P.accent} />
            <TextInput
              style={[styles.input, { color: P.ink }, { outlineStyle: 'none' } as any]}
              value={confirm}
              onChangeText={v => { setConfirm(v); setErrors(prev => ({ ...prev, confirm: undefined })); }}
              secureTextEntry={!showPw2}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              onFocus={handleInputFocus}
              placeholder={t('newPasswordConfirmPlaceholder')}
              placeholderTextColor="#A6A0B4"
            />
            <TouchableOpacity onPress={() => setShowPw2(v => !v)}>
              <Ionicons name={showPw2 ? 'eye-off-outline' : 'eye-outline'} size={19} color="#A6A0B4" />
            </TouchableOpacity>
          </View>
          {!!errors.confirm && (
            <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color="#EF4444" /><Text style={styles.errorText}>{errors.confirm}</Text></View>
          )}

          <TouchableOpacity activeOpacity={0.9} onPress={handleConfirm} disabled={loading} style={[styles.btnWrap, loading && { opacity: 0.7 }]}>
            <LinearGradient colors={P.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? t('newPasswordBtnLoading') : t('newPasswordBtn')}</Text>
              {!loading && <Ionicons name="checkmark" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </AuthStepCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 88 },
  // En movil el boton de volver va en linea dentro de la tarjeta, asi que ya no
  // hace falta reservar espacio arriba.
  scrollPhone: { padding: 16, paddingTop: 16, justifyContent: 'flex-start' },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 16, marginBottom: 14 },
  input: { flex: 1, fontSize: 15 },
  reqs: { gap: 8, marginBottom: 18 },
  reqsPhone: { gap: 6, marginBottom: 14 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reqRowPhone: { gap: 7 },
  reqText: { fontSize: 13, fontWeight: '600', flex: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 12 },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#EF4444' },
  btnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
