

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Direccion del backend cuando se trabaja en desarrollo.
 *
 * Desde el navegador del mismo PC, localhost sirve. Desde un telefono no:
 * ahi localhost es el telefono. Antes Android apuntaba a 10.0.2.2, que es
 * como el EMULADOR de Android llama a la maquina anfitriona; en un telefono
 * real esa direccion no existe y todo intento de entrar termina en "error del
 * servidor".
 *
 * La IP buena es la del PC en la red local, y no hace falta escribirla: es la
 * misma por la que el telefono acaba de cargar la app, y Expo la publica en
 * `hostUri` (algo como "192.168.20.82:8081"). Se le cambia el puerto y ya.
 */
const devHost = (): string => {
  const expo = Constants.expoConfig as { hostUri?: string } | null;
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const host = (expo?.hostUri ?? expoGo?.debuggerHost)?.split(':')[0];
  if (host) return host;
  // Sin hostUri (por ejemplo en una build de desarrollo) queda el emulador.
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : `http://${devHost()}:3000/api`
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

  signTemplates: '/sign-templates',

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
/**
 * Modelo propio de LSC (TensorFlow.js), entrenado con LSC-54 + LSC50.
 * Se sirve desde `src/web/models/lsc/` junto a `glosas.json`. Si el archivo no
 * esta, la pantalla cae al modelo generico de 7 gestos de Google.
 */
export const WORD_MODEL_URL = '/models/lsc/model.json';

export const GESTURE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
