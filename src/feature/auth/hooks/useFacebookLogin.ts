import { useCallback, useEffect, useState } from 'react';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { showError } from '../../../shared/utils/dialogs';
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

  useEffect(() => {
    if (!response) return;

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

    let cancelled = false;
    setLoading(true);

    loginWithFacebook(accessToken)
      .catch(error => {
        if (cancelled || isAuthOperationCancelled(error)) return;

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
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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