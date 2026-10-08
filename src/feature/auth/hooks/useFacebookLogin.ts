import { useCallback, useEffect, useState } from 'react';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { showError } from '../../../shared/utils/dialogs';
import { useAuth } from '../../../app/providers/AuthContext';
import { useTranslation } from '../../../app/config/i18n';
import { normalizeApiError } from '../../../shared/services/api.client';
import { FACEBOOK_APP_ID } from '../../../app/config/api.config';

/**
 * Inicio de sesion con Facebook: abre el dialogo de Facebook, recibe el
 * access token y lo cambia en el backend (POST /auth/facebook) por la sesion
 * normal de la app. Solo se puede usar si FACEBOOK_APP_ID tiene valor
 * (expo-auth-session lanza un error sin clientId).
 */
export function useFacebookLogin() {
  const { loginWithFacebook } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      void showError(t('loginFacebookError'), t('error'));
      return;
    }
    // 'cancel' / 'dismiss': el usuario cerro el dialogo, no es un error.
    if (response.type !== 'success') return;
    const accessToken = response.authentication?.accessToken ?? response.params.access_token;
    if (!accessToken) {
      void showError(t('loginFacebookError'), t('error'));
      return;
    }
    let cancelled = false;
    setLoading(true);
    loginWithFacebook(accessToken)
      .catch((error) => {
        if (cancelled) return;
        const { code } = normalizeApiError(error);
        const msg = code === 'NETWORK' ? t('loginNetworkError')
          : code === 'SERVER' ? t('serverUnavailable')
          : code === 'ACCOUNT_BLOCKED' ? t('loginAccountBlocked')
          : code === 'FACEBOOK_EMAIL_REQUIRED' ? t('loginFacebookNoEmail')
          : t('loginFacebookError');
        void showError(msg, t('error'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [response, loginWithFacebook, t]);

  const handleFacebookLogin = useCallback(() => {
    void promptAsync();
  }, [promptAsync]);

  return { handleFacebookLogin, ready: !!request, loading };
}
