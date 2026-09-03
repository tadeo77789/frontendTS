
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
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
    if (!form.correo) e.correo = t('registerEmailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = t('registerEmailInvalid');
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
        email: form.correo,
        password: form.password,
        termino_acept: form.terminos,
      });
    } catch {
      Alert.alert(t('error'), t('registerErrorMsg'));
    } finally {
      setLoading(false);
    }
  }, [validate, register, form, t]);

  return { form, setField, loading, errors, handleRegister };
}
