import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { deleteAccount } from '../../auth/services/auth.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Se llama tras borrar la cuenta en el servidor; el padre cierra la sesión y avisa. */
  onDeleted: () => void;
}

export const DeleteAccountModal: React.FC<Props> = ({ visible, onClose, onDeleted }) => {
  const C = useColors();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (loading) return;
    setPassword('');
    setShow(false);
    setError('');
    onClose();
  };

  const submit = async () => {
    if (loading) return;
    if (!password) { setError(t('deleteAccountPasswordRequired')); return; }
    setLoading(true);
    setError('');
    try {
      await deleteAccount(password);
    } catch (e) {
      setLoading(false);
      const { code } = normalizeApiError(e);
      setError(
        code === 'INVALID_PASSWORD' ? t('deleteAccountInvalidPassword')
          : code === 'LAST_ADMIN' ? t('deleteAccountLastAdmin')
          : code === 'NETWORK' ? t('loginNetworkError')
          : code === 'SERVER' ? t('serverUnavailable')
          : t('accountActionError'),
      );
      return;
    }
    setLoading(false);
    setPassword('');
    setShow(false);
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
          <Text style={[styles.body, { color: C.textSecondary }]}>{t('deleteAccountWarning')}</Text>

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
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, height: 52, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15 },
  error: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '800' },
});
