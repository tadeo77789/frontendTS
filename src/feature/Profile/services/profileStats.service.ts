import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import type { MyStats } from '../data/achievements';

export const profileStatsService = {
  /** Consulta con el token de origen y permite cancelar la solicitud. */
  async getMine(token: string, signal: AbortSignal): Promise<MyStats> {
    const res = await api.get(ENDPOINTS.myTranslationStats, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return res.data.data as MyStats;
  },
};