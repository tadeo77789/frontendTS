import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import type { MyStats } from '../data/achievements';

export const profileStatsService = {
  async getMine(): Promise<MyStats> {
    const res = await api.get(ENDPOINTS.myTranslationStats);
    return res.data.data as MyStats;
  },
};
