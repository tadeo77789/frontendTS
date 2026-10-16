import Constants from 'expo-constants';

/** Versión de la app según app.json (expoConfig.version); "—" si no está disponible. */
export const APP_VERSION: string = Constants.expoConfig?.version || '—';
