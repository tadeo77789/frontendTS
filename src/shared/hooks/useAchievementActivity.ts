import { useCallback, useMemo } from 'react';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../../app/providers/AuthContext';
import { useAccess } from '../../app/providers/AccessContext';
import { api } from '../services/api.client';

/** Las solicitudes conservan el token y la sesión de origen aunque cambie la autenticación en curso. */
export const useAchievementActivity = () => {
  const { token, sessionGeneration, isSessionCurrent } = useAuth();
  const { permissions, isLoading, error } = useAccess();
  const sessionId = useMemo(() => Crypto.randomUUID(), [token, sessionGeneration]);
  const eligible = !!token && !isLoading && !error && !permissions.includes('users.manage');
  const isCurrent = useCallback(() => isSessionCurrent(sessionGeneration), [isSessionCurrent, sessionGeneration]);
  const context = useMemo(() => ({ token, sessionId, eligible, isCurrent }), [token, sessionId, eligible, isCurrent]);
  const record = useCallback(async (body: Record<string, unknown>) => {
    if (!eligible || !isSessionCurrent(sessionGeneration)) return undefined;
    const response = await api.post('/achievements/activity', { ...body, sessionId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!isSessionCurrent(sessionGeneration)) return undefined;
    return response.data?.data as { playbackId?: string } | undefined;
  }, [token, eligible, sessionId, sessionGeneration, isSessionCurrent]);
  return { context, record };
};
