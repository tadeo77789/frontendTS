

import { Platform } from 'react-native';

/**
 * Backend publicado en el VPS de Hostinger (gateway en el puerto 8080).
 * Web en desarrollo, Expo Go y la APK apuntan aqui. Cuando haya dominio con
 * HTTPS, se cambia solo esta constante (por ejemplo 'https://tudominio.com/api').
 */
const VPS_API_URL = 'http://179.236.77.215:8080/api';

// La web en produccion se sirve detras del mismo dominio que la API, por eso usa ruta relativa.
export const API_BASE_URL = !__DEV__ && Platform.OS === 'web' ? '/api' : VPS_API_URL;

export const API_TIMEOUT = 10_000;

/**
 * App ID de Facebook (developers.facebook.com). No es secreto: el App Secret
 * vive solo en el backend. Se lee de EXPO_PUBLIC_FACEBOOK_APP_ID al compilar;
 * vacio = boton de Facebook desactivado con un aviso.
 */
export const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';

/**
 * Client IDs de OAuth de Google (console.cloud.google.com), uno por plataforma.
 * No son secretos. Se leen de EXPO_PUBLIC_GOOGLE_*_CLIENT_ID al compilar;
 * vacio en la plataforma actual = boton de Google desactivado con un aviso.
 * El backend debe tener los mismos IDs en GOOGLE_CLIENT_IDS.
 */
export const GOOGLE_CLIENT_IDS = {
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
};

export const ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  verifyCode: '/auth/verify-code',
  verifyEmail: '/auth/verify-email',
  resendVerification: '/auth/resend-verification',
  resetPassword: '/auth/reset-password',
  facebookLogin: '/auth/facebook',
  googleLogin: '/auth/google',

  me: '/users/me',
  mePassword: '/users/me/password',

  translate: '/translations',
  history: '/translations/history',
  deleteTranslation: (id: number) => `/translations/${id}`,
  translationsStats: '/translations/stats',
  myTranslationStats: '/translations/me/stats',
  usersStats: '/users/stats',

  iamMyAccess: '/iam/me/access',
  iamRoles: '/iam/roles',
  iamUserRoles: (userId: number) => `/iam/users/${userId}/roles`,
  iamUserRole: (userId: number, roleName: string) =>
    `/iam/users/${userId}/roles/${encodeURIComponent(roleName)}`,
  iamRole: (roleId: number) => `/iam/roles/${roleId}`,

  signTemplates: '/sign-templates',

  lexicon: '/lexicon',
  lexiconSearch: '/lexicon/search',
  lexiconAlphabet: '/lexicon/alphabet',

  analyticsEvents: '/analytics/events',
  analyticsSectionReport: '/analytics/reports/sections',
};

export const TFJS_MODEL_URL = '';
export const TFJS_LABELS_URL = '';

// --- MediaPipe Gesture Recognizer (modo "palabras", solo web) ---

// Runtime de MediaPipe Tasks Vision. Se carga por CDN para no tener que servir
// los .wasm desde node_modules.
//
// OJO: la version DEBE coincidir con la de `@mediapipe/tasks-vision` en
// package.json. Ese paquete esta instalado solo para aportar los tipos
// (`import type`), y si las versiones se separan los tipos dejarian de
// describir el codigo que realmente se ejecuta.
export const MEDIAPIPE_VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

// Modelo pre-entrenado (~8 MB). Se sirve desde el CDN de Google para no
// versionar el binario en el repo. Para trabajar sin internet, descargarlo a
// `src/web/models/gesture_recognizer.task` y cambiar esta constante por
// '/models/gesture_recognizer.task'.
/**
 * Modelo propio de LSC (TensorFlow.js), entrenado con LSC-54 + LSC50.
 * Se sirve desde `src/web/models/lsc/` junto a `glosas.json`. Si el archivo no
 * esta, la pantalla cae al modelo generico de 7 gestos de Google.
 */
export const WORD_MODEL_URL = '/models/lsc/model.json';

export const GESTURE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
