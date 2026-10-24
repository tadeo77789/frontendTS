import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import { showConfirm, showError } from '../../../shared/utils/dialogs';
import { signInWithSocialConsent } from '../services/socialConsent';
import { isAuthOperationCancelled, useAuth } from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { GOOGLE_CLIENT_IDS } from '../../../app/config/api.config';

/** Client ID de la plataforma actual, o '' si falta. */
export const currentGoogleClientId = (): string =>
  Platform.OS === 'android' ? GOOGLE_CLIENT_IDS.android
    : Platform.OS === 'ios' ? GOOGLE_CLIENT_IDS.ios
      : GOOGLE_CLIENT_IDS.web;

/** Google no permite registrar la redireccion de Expo Go: ahi el boton queda desactivado. */
const isExpoGo = (): boolean =>
  Platform.OS !== 'web' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isGoogleLoginAvailable = (): boolean => !isExpoGo() && currentGoogleClientId() !== '';

/**
 * Inicio de sesion con Google: abre el dialogo de Google, recibe el ID token
 * y lo cambia en el backend (POST /auth/google) por la sesion normal de la app.
 * Solo se puede usar si isGoogleLoginAvailable() (expo-auth-session lanza un
 * error sin client ID de la plataforma actual).
 */
export function useGoogleLogin() {
  const { loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.web || undefined,
    androidClientId: GOOGLE_CLIENT_IDS.android || undefined,
    iosClientId: GOOGLE_CLIENT_IDS.ios || undefined,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Cada respuesta de Google se procesa una sola vez. El efecto se vuelve a ejecutar con
  // cada render (t cambia de identidad) y el login cambia el estado de la sesion: sin
  // esta guarda se lanzaba un login nuevo en cada render, cancelando el anterior (bucle).
  const handledResponseRef = useRef<typeof response>(null);

  useEffect(() => {
    if (!response || handledResponseRef.current === response) return;
    handledResponseRef.current = response;
    if (response.type === 'error') {
      void showError(t('loginGoogleError'), t('error'));
      return;
    }
    // 'cancel' / 'dismiss': el usuario cerro el dialogo, no es un error.
    if (response.type !== 'success') return;
    const idToken = response.params.id_token ?? response.authentication?.idToken;
    if (!idToken) {
      void showError(t('loginGoogleError'), t('error'));
      return;
    }
    setLoading(true);
    // Cuenta nueva: el backend pide el consentimiento (TERMS_REQUIRED) y se reintenta con el mismo token.
    signInWithSocialConsent(
      acceptedTerms => loginWithGoogle(idToken, acceptedTerms),
      () => showConfirm({
        title: t('socialTermsTitle'),
        message: t('socialTermsMessage'),
        confirmText: t('socialTermsAccept'),
        cancelText: t('cancel'),
      }),
    )
      .catch((error) => {
        // Sesion sustituida (logout u otro login a mitad): no es un error del usuario.
        if (!mountedRef.current || isAuthOperationCancelled(error)) return;
        const { code, status } = normalizeApiError(error);
        const msg = code === 'NETWORK' ? t('loginNetworkError')
          : status === 503 ? t('loginGoogleUnavailable')
          : code === 'SERVER' ? t('serverUnavailable')
          : code === 'ACCOUNT_BLOCKED' ? t('loginAccountBlocked')
          : code === 'EMAIL_NOT_VERIFIED' ? t('loginGoogleEmailNotVerified')
          : t('loginGoogleError');
        void showError(msg, t('error'));
      })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [response, loginWithGoogle, t]);

  const handleGoogleLogin = useCallback(() => {
    void promptAsync();
  }, [promptAsync]);

  return { handleGoogleLogin, ready: !!request, loading };
}
