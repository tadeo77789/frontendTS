
import { useState, useCallback, useMemo } from 'react';
import { showError } from '../../../shared/utils/dialogs';
import { useAuth } from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { checkEmail, isValidEmail, normalizeEmail, type EmailIssue } from '../../../shared/utils/email';

interface LoginErrors {
  email?: string;
  password?: string;
}

export function useLoginForm() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmailValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  // El error de correo solo se muestra cuando el campo ya se "toco" (blur o
  // intento de envio), para no regañar al usuario mientras aun escribe.
  const [emailTouched, setEmailTouched] = useState(false);

  const emailMessage = useCallback((issue: EmailIssue | undefined): string | undefined => {
    if (!issue) return undefined;
    if (issue === 'required') return t('loginEmailRequired');
    // Sin arroba: lo que escribio parece un nombre de usuario, no un correo.
    if (issue === 'notEmail') return t('loginEmailNotUser');
    return t('loginEmailInvalid');
  }, [t]);

  const emailValid = useMemo(() => isValidEmail(email), [email]);

  const setEmail = useCallback((value: string) => {
    setEmailValue(value);
    // Una vez tocado, el mensaje se actualiza en vivo: aparece apenas deja de
    // ser un correo valido y desaparece en cuanto lo es.
    setErrors(prev => (emailTouched ? { ...prev, email: emailMessage(checkEmail(value)) } : { ...prev, email: undefined }));
  }, [emailTouched, emailMessage]);

  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
    setErrors(prev => ({ ...prev, email: emailMessage(checkEmail(email)) }));
  }, [email, emailMessage]);

  const validate = useCallback((): boolean => {
    const e: LoginErrors = {};
    e.email = emailMessage(checkEmail(email));
    if (!password) e.password = t('loginPasswordRequired');
    setEmailTouched(true);
    setErrors(e);
    return !e.email && !e.password;
  }, [email, password, emailMessage, t]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: normalizeEmail(email), password });
    } catch (error) {
      const { code } = normalizeApiError(error);
      const msg = code === 'NETWORK' ? t('loginNetworkError') : code === 'SERVER' ? t('serverUnavailable') : t('loginErrorMsg');
      void showError(msg, t('error'));
    } finally {
      setLoading(false);
    }
  }, [validate, login, email, password, t]);

  return { email, setEmail, handleEmailBlur, emailValid, password, setPassword, loading, errors, handleLogin };
}
