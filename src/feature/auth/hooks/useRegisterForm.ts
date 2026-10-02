
import { useState, useCallback } from 'react';
import { showError, showAlert } from '../../../shared/utils/dialogs';
import { useNavigation } from '@react-navigation/native';
import { normalizeEmail, checkEmail } from '../../../shared/utils/email';
import { useAuth } from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { evaluatePassword } from '../../../shared/utils/passwordStrength';

interface RegisterForm {
  nombre: string;
  correo: string;
  password: string;
  terminos: boolean;
}

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

export function useRegisterForm() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [form, setForm] = useState<RegisterForm>({
    nombre: '',
    correo: '',
    password: '',
    terminos: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const setField = useCallback(<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const validate = useCallback((): boolean => {
    const e: RegisterErrors = {};
    if (!form.nombre.trim()) e.nombre = t('registerNameRequired');
    const emailIssue = checkEmail(form.correo);
    if (emailIssue === 'required') e.correo = t('registerEmailRequired');
    else if (emailIssue) e.correo = t('registerEmailInvalid');
    if (!form.password) {
      e.password = t('registerPasswordRequired');
    } else {
      const { checks, meetsMinimum } = evaluatePassword(form.password);
      if (!checks.length) e.password = t('registerPasswordShort');
      else if (!meetsMinimum) e.password = t('registerPasswordWeak');
    }
    if (!form.terminos) e.terminos = t('registerTermsRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, t]);

  const handleRegister = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        nombre: form.nombre,
        edad: 0,
        email: normalizeEmail(form.correo),
        password: form.password,
        termino_acept: form.terminos,
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'REGISTERED_LOGIN_FAILED') {
        void showAlert({ message: t('registerSuccessLoginFailed'), icon: 'success' });
        navigation.navigate('Login');
        return;
      }
      const { code } = normalizeApiError(error);
      const msg = code === 'NETWORK' ? t('loginNetworkError') : code === 'SERVER' ? t('serverUnavailable') : t('registerErrorMsg');
      void showError(msg, t('error'));
    } finally {
      setLoading(false);
    }
  }, [validate, register, form, t, navigation]);

  return { form, setField, loading, errors, handleRegister };
}
