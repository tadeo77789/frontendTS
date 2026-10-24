import { useCallback, useEffect, useRef, useState } from 'react';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { showConfirm, showError } from '../../../shared/utils/dialogs';
import { signInWithSocialConsent } from '../services/socialConsent';
import {
  useAuth,
  isAuthOperationCancelled,
} from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { FACEBOOK_APP_ID } from '../../../app/config/api.config';

/**
 * Cambia el token de Facebook por una sesión del backend.
 * Requiere FACEBOOK_APP_ID.
 */
export function useFacebookLogin() {
  const { loginWithFacebook } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Cada respuesta de Facebook se procesa una sola vez (ver useGoogleLogin): el efecto se
  // repite en cada render y el login cambia el estado de la sesion, lo que provocaba un bucle.
  const handledResponseRef = useRef<typeof response>(null);

  useEffect(() => {
    if (!response || handledResponseRef.current === response) return;
    handledResponseRef.current = response;

    if (response.type === 'error') {
      void showError(t('loginFacebookError'), t('error'));
      return;
    }

    if (response.type !== 'success') return;

    const accessToken =
      response.authentication?.accessToken
      ?? response.params.access_token;

    if (!accessToken) {
      void showError(t('loginFacebookError'), t('error'));
      return;
    }

    setLoading(true);

    // Cuenta nueva: el backend pide el consentimiento (TERMS_REQUIRED) y se reintenta con el mismo token.
    signInWithSocialConsent(
      acceptedTerms => loginWithFacebook(accessToken, acceptedTerms),
      () => showConfirm({
        title: t('socialTermsTitle'),
        message: t('socialTermsMessage'),
        confirmText: t('socialTermsAccept'),
        cancelText: t('cancel'),
      }),
    )
      .catch(error => {
        if (!mountedRef.current || isAuthOperationCancelled(error)) return;

        const { code } = normalizeApiError(error);
        const message = code === 'NETWORK' ? t('loginNetworkError')
          : code === 'SERVER' ? t('serverUnavailable')
          : code === 'ACCOUNT_BLOCKED' ? t('loginAccountBlocked')
          : code === 'FACEBOOK_EMAIL_REQUIRED'
            ? t('loginFacebookNoEmail')
            : t('loginFacebookError');

        void showError(message, t('error'));
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [response, loginWithFacebook, t]);

  const handleFacebookLogin = useCallback(() => {
    void promptAsync();
  }, [promptAsync]);

  return {
    handleFacebookLogin,
    ready: !!request,
    loading,
  };
}