
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../../../app/config/api.config';
import type { User } from '../../../shared/types';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');

    if (token && token !== 'mock-token-123') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {

  }
  return config;
});

export const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const raw = await AsyncStorage.getItem('@auth_user');
    if (!raw) return null;
    const user = JSON.parse(raw) as Partial<User>;
    return typeof user?.id_usuario === 'number' ? user.id_usuario : null;
  } catch {
    return null;
  }
};
