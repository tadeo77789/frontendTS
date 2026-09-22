

import { Platform } from 'react-native';

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api'
  : Platform.OS === 'web'
    ? '/api'
    : 'https://api.traducsenas.com/api';

export const API_TIMEOUT = 10_000;

export const ENDPOINTS = {

  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  forgotPassword: '/auth/forgot-password',
  verifyCode: '/auth/verify-code',
  resetPassword: '/auth/reset-password',

  translate: '/translations',
  history: '/translations/history',
  deleteTranslation: (id: number) => `/translations/${id}`,

  lexicon: '/lexicon',
  lexiconSearch: '/lexicon/search',

  stats: '/stats',

  profile: '/users/profile',
  updateProfile: '/users/profile',
  deleteAccount: '/users/delete',
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
export const GESTURE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
