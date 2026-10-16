import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';

export type PreferencesLanguage = 'ES' | 'EN';
export type PreferencesTheme = 'LIGHT' | 'DARK';

export interface ProfilePreferences {
  uiLanguage: PreferencesLanguage;
  theme: PreferencesTheme;
  notificationsEnabled: boolean;
  updatedAt?: string;
}

export type PreferencesPatch = Partial<
  Pick<
    ProfilePreferences,
    'uiLanguage' | 'theme' | 'notificationsEnabled'
  >
>;

export interface PreferencesRequestOptions {
  /** Token sin el prefijo "Bearer", capturado al crear la solicitud. */
  token: string;
  signal?: AbortSignal;
}

export class PreferencesResponseError extends Error {
  constructor() {
    super('La respuesta de preferencias no cumple el contrato');
    this.name = 'PreferencesResponseError';
  }
}

export class PreferencesInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreferencesInputError';
  }
}

const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value);

const isLanguage = (
  value: unknown,
): value is PreferencesLanguage =>
  value === 'ES' || value === 'EN';

const isTheme = (
  value: unknown,
): value is PreferencesTheme =>
  value === 'LIGHT' || value === 'DARK';

export const parsePreferencesResponse = (
  value: unknown,
): ProfilePreferences => {
  if (
    !isRecord(value)
    || !isLanguage(value.uiLanguage)
    || !isTheme(value.theme)
    || typeof value.notificationsEnabled !== 'boolean'
  ) {
    throw new PreferencesResponseError();
  }

  const updatedAt = value.updatedAt;
  if (
    updatedAt !== undefined
    && (
      typeof updatedAt !== 'string'
      || updatedAt.trim().length === 0
      || Number.isNaN(Date.parse(updatedAt))
    )
  ) {
    throw new PreferencesResponseError();
  }

  const preferences: ProfilePreferences = {
    uiLanguage: value.uiLanguage,
    theme: value.theme,
    notificationsEnabled: value.notificationsEnabled,
  };

  if (updatedAt !== undefined) preferences.updatedAt = updatedAt;

  return preferences;
};

const PATCH_FIELDS = [
  'uiLanguage',
  'theme',
  'notificationsEnabled',
] as const;

const parsePatch = (value: unknown): PreferencesPatch => {
  if (!isRecord(value)) {
    throw new PreferencesInputError('El PATCH debe ser un objeto');
  }

  if (Object.keys(value).some(
    key => !PATCH_FIELDS.some(field => field === key),
  )) {
    throw new PreferencesInputError('El PATCH contiene campos no admitidos');
  }

  const patch: PreferencesPatch = {};

  if (value.uiLanguage !== undefined) {
    if (!isLanguage(value.uiLanguage)) {
      throw new PreferencesInputError('uiLanguage debe ser ES o EN');
    }
    patch.uiLanguage = value.uiLanguage;
  }

  if (value.theme !== undefined) {
    if (!isTheme(value.theme)) {
      throw new PreferencesInputError('theme debe ser LIGHT o DARK');
    }
    patch.theme = value.theme;
  }

  if (value.notificationsEnabled !== undefined) {
    if (typeof value.notificationsEnabled !== 'boolean') {
      throw new PreferencesInputError(
        'notificationsEnabled debe ser booleano',
      );
    }
    patch.notificationsEnabled = value.notificationsEnabled;
  }

  if (Object.keys(patch).length === 0) {
    throw new PreferencesInputError('El PATCH no contiene cambios');
  }

  return patch;
};

const requestConfig = ({
  token,
  signal,
}: PreferencesRequestOptions) => {
  if (
    typeof token !== 'string'
    || token.length === 0
    || /\s/.test(token)
  ) {
    throw new PreferencesInputError(
      'Se requiere un token sin espacios ni prefijo Bearer',
    );
  }

  return {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  };
};

export const preferencesService = {
  async get(
    options: PreferencesRequestOptions,
  ): Promise<ProfilePreferences> {
    const response = await api.get<unknown>(
      ENDPOINTS.profilePreferences,
      requestConfig(options),
    );

    return parsePreferencesResponse(response.data);
  },

  async patch(
    changes: PreferencesPatch,
    options: PreferencesRequestOptions,
  ): Promise<ProfilePreferences> {
    const patch = parsePatch(changes);

    const response = await api.patch<unknown>(
      ENDPOINTS.profilePreferences,
      patch,
      requestConfig(options),
    );

    return parsePreferencesResponse(response.data);
  },
};
