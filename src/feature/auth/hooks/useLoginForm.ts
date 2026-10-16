import { useState, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showError, showAlert } from '../../../shared/utils/dialogs';
import {
  useAuth,
  isAuthOperationCancelled,
} from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { pendingAuthFlow } from '../services/pendingAuthFlow';
import {
  checkEmail,
  isValidEmail,
  normalizeEmail,
  type EmailIssue,
} from '../../../shared/utils/email';

interface LoginErrors {
  email?: string;
  password?: string;
}

export function useLoginForm() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [email, setEmailValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [emailTouched, setEmailTouched] = useState(false);

  const emailMessage = useCallback((
    issue: EmailIssue | undefined,
  ): string | undefined => {
    if (!issue) return undefined;
    if (issue === 'required') return t('loginEmailRequired');
    if (issue === 'notEmail') return t('loginEmailNotUser');
    return t('loginEmailInvalid');
  }, [t]);

  const emailValid = useMemo(() => isValidEmail(email), [email]);

  const setEmail = useCallback((value: string) => {
    setEmailValue(value);
    setErrors(prev => (
      emailTouched
        ? { ...prev, email: emailMessage(checkEmail(value)) }
        : { ...prev, email: undefined }
    ));
  }, [emailTouched, emailMessage]);

  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
    setErrors(prev => ({
      ...prev,
      email: emailMessage(checkEmail(email)),
    }));
  }, [email, emailMessage]);

  const validate = useCallback((): boolean => {
    const next: LoginErrors = {};
    next.email = emailMessage(checkEmail(email));
    if (!password) next.password = t('loginPasswordRequired');
    setEmailTouched(true);
    setErrors(next);
    return !next.email && !next.password;
  }, [email, password, emailMessage, t]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: normalizeEmail(email), password });
    } catch (error) {
      if (isAuthOperationCancelled(error)) return;

      const { code } = normalizeApiError(error);
      if (code === 'EMAIL_NOT_VERIFIED') {
        pendingAuthFlow.set({
          mode: 'verify',
          email: normalizeEmail(email),
          password,
        });
        AccessibilityInfo.announceForAccessibility(
          t('loginConfirmEmail'),
        );
        void showAlert({
          message: t('loginConfirmEmail'),
          icon: 'info',
        });
        navigation.navigate('VerifyCode', { mode: 'verify' });
        return;
      }

      const message = code === 'NETWORK' ? t('loginNetworkError')
        : code === 'SERVER' ? t('serverUnavailable')
        : code === 'ACCOUNT_BLOCKED' ? t('loginAccountBlocked')
        : t('loginErrorMsg');

      void showError(message, t('error'));
    } finally {
      setLoading(false);
    }
  }, [validate, login, email, password, t, navigation]);

  return {
    email,
    setEmail,
    handleEmailBlur,
    emailValid,
    password,
    setPassword,
    loading,
    errors,
    handleLogin,
  };
}