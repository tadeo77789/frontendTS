import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import {
  AuthStepCard,
  useAuthPalette,
} from '../components/AuthStepCard';

import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { isValidEmail, normalizeEmail } from '../../../shared/utils/email';
import { normalizeApiError } from '../../../shared/services/api.client';
import { showAlert, showError } from '../../../shared/utils/dialogs';
import { forgotPassword } from '../services/auth.service';
import { passwordResetFlow } from '../services/passwordResetFlow';
import { RESEND_COOLDOWN_MS } from '../services/pendingAuthFlow';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const themed = useColors();
  const P = useAuthPalette(false, themed);
  const { t } = useTranslation();

  const { width } = useWindowDimensions();
  const isPhone = width < 480;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setEmailError(t('forgotEmailRequired'));
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setEmailError(t('forgotEmailInvalid'));
      return;
    }

    setEmail(normalizedEmail);
    setEmailError('');
    setLoading(true);
    try {
      await forgotPassword(normalizedEmail);
    } catch (error) {
      setLoading(false);
      const { code } = normalizeApiError(error);
      if (code === 'VALIDATION_ERROR') setEmailError(t('forgotEmailInvalid'));
      else void showError(
        code === 'NETWORK' ? t('loginNetworkError') : code === 'SERVER' ? t('serverUnavailable') : t('accountActionError'),
        t('error'),
      );
      return;
    }
    setLoading(false);
    // El servidor responde igual exista o no la cuenta: mensaje neutro y siguiente paso.
    passwordResetFlow.set({ email: normalizedEmail, resendAvailableAt: Date.now() + RESEND_COOLDOWN_MS });
    void showAlert({ message: t('forgotSentNeutral'), icon: 'info' });
    navigation.navigate('VerifyCode', { mode: 'reset' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: P.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, isPhone && styles.scrollPhone]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthStepCard
          P={P}
          step={1}
          icon="lock-closed-outline"
          title={t('forgotTitle')}
          subtitle={t('forgotSubtitle')}
          onBack={() => navigation.goBack()}
        >
          <Text style={[styles.label, { color: P.label }]}>{t('forgotEmailLabel')}</Text>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: P.field, borderColor: emailError ? '#D9534F' : P.border },
            ]}
          >
            <Ionicons name="mail-outline" size={22} color={P.accent} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                { color: P.ink },
                Platform.OS === 'web' && ({ outlineStyle: 'none', outlineWidth: 0 } as any),
              ]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              placeholder={t('forgotEmailPlaceholder')}
              placeholderTextColor={P.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: P.accent }, loading && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{loading ? t('forgotBtnLoading') : t('forgotBtn')}</Text>
          </TouchableOpacity>
        </AuthStepCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 88,
  },

  scrollPhone: {
    padding: 16,
    paddingTop: 16,
    justifyContent: 'flex-start',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  errorText: {
    color: '#D9534F',
    fontSize: 13,
    marginTop: 6,
  },

  profileEmailBox: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 4,
  },

  profileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  profileEmailContent: {
    flex: 1,
  },

  profileEmailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },

  profileEmailText: {
    fontSize: 16,
    fontWeight: '600',
  },

  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});