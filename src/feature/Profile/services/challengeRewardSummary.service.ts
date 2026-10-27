import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';

export const challengeRewardSummaryService = {
  async getMine(token: string, signal: AbortSignal): Promise<number> {
    const response = await api.get(ENDPOINTS.challengeRewardSummary, {
      headers: { Authorization: `Bearer ${token}` }, signal,
    });
    const body = response.data;
    if (body?.success !== true || !Number.isSafeInteger(body.data?.totalPoints) || body.data.totalPoints < 0) {
      throw new Error('Invalid challenge reward summary');
    }
    return body.data.totalPoints;
  },
};
