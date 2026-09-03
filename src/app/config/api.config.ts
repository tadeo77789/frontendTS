

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
