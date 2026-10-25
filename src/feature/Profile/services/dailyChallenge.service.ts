import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';

export interface DailyChallenge {
  challengeId: string; code: string; name: string; description: string;
  targetCount: number; currentCount: number; points: number;
  completed: boolean; completedAt: string | null; date: string;
}
export const parseDailyChallenge = (response: unknown): DailyChallenge | null => {
  const body = response as { success?: unknown; data?: unknown } | null;
  if (body?.success !== true) throw new Error('Invalid daily challenge response');
  if (body.data === null) return null;
  const value = body.data as DailyChallenge | undefined;
  if (!value || !['challengeId', 'code', 'name', 'description', 'date'].every(key => typeof value[key as keyof DailyChallenge] === 'string')
    || !Number.isInteger(value.targetCount) || value.targetCount <= 0
    || !Number.isInteger(value.currentCount) || value.currentCount < 0 || value.currentCount > value.targetCount
    || !Number.isInteger(value.points) || value.points < 0 || typeof value.completed !== 'boolean'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
    || !(value.completedAt === null || typeof value.completedAt === 'string' && Number.isFinite(Date.parse(value.completedAt)))
    || value.completed !== (value.completedAt !== null)
    || value.completed !== (value.currentCount === value.targetCount)) throw new Error('Invalid daily challenge');
  return value;
};
export const dailyChallengeService = {
  async today(token: string, signal: AbortSignal): Promise<DailyChallenge | null> {
    const response = await api.get(ENDPOINTS.dailyChallenge, {
      headers: { Authorization: `Bearer ${token}` }, signal,
    });
    return parseDailyChallenge(response.data);
  },
};
