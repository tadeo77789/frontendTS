import { normalizeApiError } from '../../../shared/services/api.client';

/** Resultado del login social: `declined` = la cuenta era nueva y la persona no acepto los terminos. */
export type SocialSignInOutcome = 'signed-in' | 'declined';

/**
 * Login social con consentimiento (Ley 1581). Primero intenta sin consentimiento: una cuenta que ya
 * existe entra directo. Si la cuenta es nueva, el backend responde TERMS_REQUIRED; entonces se pide
 * la autorizacion expresa y, si la da, se reintenta con el mismo token del proveedor.
 * Cualquier otro error se propaga para que el boton lo muestre como hasta ahora.
 */
export const signInWithSocialConsent = async (
  signIn: (acceptedTerms: boolean) => Promise<void>,
  askConsent: () => Promise<boolean>,
): Promise<SocialSignInOutcome> => {
  try {
    await signIn(false);
    return 'signed-in';
  } catch (error) {
    if (normalizeApiError(error).code !== 'TERMS_REQUIRED') throw error;
  }
  if (!(await askConsent())) return 'declined';
  await signIn(true);
  return 'signed-in';
};
