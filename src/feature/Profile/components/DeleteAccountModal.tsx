import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useAuth } from '../../../app/providers/AuthContext';
import { ENDPOINTS } from '../../../app/config/api.config';
import { api, normalizeApiError } from '../../../shared/services/api.client';
import { deleteAccount, sendDeletionCode } from '../../auth/services/auth.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Se llama tras borrar la cuenta en el servidor; el padre cierra la sesión y avisa. */
  onDeleted: () => void;
}

/** Mismo intervalo que exige el backend entre envios de codigo. */
const RESEND_COOLDOWN_S = 60;
const HTTP_TOO_MANY_REQUESTS = 429;

export const DeleteAccountModal: React.FC<Props> = ({ visible, onClose, onDeleted }) => {
  const C = useColors();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cuentas creadas con Google no tienen contraseña: confirman con un codigo enviado al correo.
  const [hasPassword, setHasPassword] = useState(true);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    api.get(ENDPOINTS.me)
      .then(({ data }) => {
        // Sin has_password (backend anterior) se mantiene la confirmacion con contraseña.
        if (active) setHasPassword(data?.data?.has_password !== false);
      })
      .catch(() => { if (active) setHasPassword(true); });
    return () => { active = false; };
  }, [visible]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const codeMode = !hasPassword;

  const close = () => {
    if (loading) return;
    setPassword('');
    setShow(false);
    setCode('');
    setCodeSent(false);
    setInfo('');
    setError('');
    onClose();
  };

  const handleSendCode = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setError('');
    try {
      await sendDeletionCode();
    } catch (e) {
      setSending(false);
      const { code: apiCode, status } = normalizeApiError(e);
      if (status === HTTP_TOO_MANY_REQUESTS) {
        setCooldown(RESEND_COOLDOWN_S);
        setError(t('deleteAccountCodeWait'));
      } else {
        setError(apiCode === 'NETWORK' ? t('loginNetworkError')
          : apiCode === 'SERVER' ? t('serverUnavailable') : t('accountActionError'));
      }
      return;
    }
    setSending(false);
    setCodeSent(true);
    setCooldown(RESEND_COOLDOWN_S);
    setInfo(t('deleteAccountCodeSent', { email: user?.email ?? '' }));
  };

  const submit = async () => {
    if (loading) return;
    if (codeMode) {
      if (!/^\d{6}$/.test(code)) { setError(t('deleteAccountCodeRequired')); return; }
    } else if (!password) { setError(t('deleteAccountPasswordRequired')); return; }
    setLoading(true);
    setError('');
    try {
      await deleteAccount(codeMode ? { code } : { password });
    } catch (e) {
      setLoading(false);
      const { code: apiCode } = normalizeApiError(e);
      setError(
        apiCode === 'INVALID_PASSWORD' ? t('deleteAccountInvalidPassword')
          : apiCode === 'INVALID_CODE' ? t('deleteAccountInvalidCode')
          : apiCode === 'LAST_ADMIN' ? t('deleteAccountLastAdmin')
          : apiCode === 'NETWORK' ? t('loginNetworkError')
          : apiCode === 'SERVER' ? t('serverUnavailable')
          : t('accountActionError'),
      );
      return;
    }
    setLoading(false);
    setPassword('');
    setShow(false);
    setCode('');
    onDeleted();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.titleRow}>
            <Ionicons name="trash-outline" size={22} color={C.danger} />
            <Text style={[styles.title, { color: C.textPrimary }]}>{t('profileDeleteAccount')}</Text>
          </View>
          <Text style={[styles.body, { color: C.textSecondary }]}>
            {t(codeMode ? 'deleteAccountWarningCode' : 'deleteAccountWarning')}
          </Text>

          {codeMode ? (
            <>
              <TouchableOpacity
                style={[styles.sendBtn, { borderColor: C.primary }, (sending || cooldown > 0) && { opacity: 0.6 }]}
                onPress={handleSendCode}
                disabled={sending || cooldown > 0}
                accessibilityRole="button"
              >
                <Ionicons name="mail-outline" size={18} color={C.primary} />
                <Text style={[styles.btnText, { color: C.primary }]}>
                  {cooldown > 0 ? t('deleteAccountResendIn', { seconds: cooldown })
                    : codeSent ? t('deleteAccountResendCode') : t('deleteAccountSendCode')}
                </Text>
              </TouchableOpacity>
              {!!info && <Text style={[styles.info, { color: C.textSecondary }]}>{info}</Text>}
              <View style={[styles.field, { backgroundColor: C.inputBg, borderColor: error ? C.danger : C.border }]}>
                <Ionicons name="keypad-outline" size={19} color={C.primary} />
                <TextInput
                  style={[styles.input, { color: C.textPrimary }, { outlineStyle: 'none' } as any]}
                  value={code}
                  onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  placeholder={t('deleteAccountCodePlaceholder')}
                  placeholderTextColor={C.textHint}
                  onSubmitEditing={submit}
                />
              </View>
            </>
          ) : (
            <View style={[styles.field, { backgroundColor: C.inputBg, borderColor: error ? C.danger : C.border }]}>
              <Ionicons name="lock-closed-outline" size={19} color={C.primary} />
              <TextInput
                style={[styles.input, { color: C.textPrimary }, { outlineStyle: 'none' } as any]}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                placeholder={t('password')}
                placeholderTextColor={C.textHint}
                onSubmitEditing={submit}
              />
              <TouchableOpacity onPress={() => setShow(v => !v)}>
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color={C.textHint} />
              </TouchableOpacity>
            </View>
          )}
          {!!error && <Text style={[styles.error, { color: C.danger }]}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, { borderColor: C.border }]} onPress={close} disabled={loading}>
              <Text style={[styles.btnText, { color: C.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.danger, borderColor: C.danger }, loading && { opacity: 0.7 }]}
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>{loading ? t('loading') : t('profileDeleteAccount')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, padding: 22, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  body: { fontSize: 14, lineHeight: 20 },
  info: { fontSize: 13, lineHeight: 18 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, height: 46 },
  error: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '800' },
});
