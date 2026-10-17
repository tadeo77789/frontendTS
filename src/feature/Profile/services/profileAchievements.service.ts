import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import {
  parseAchievementsResponse,
  type PersistedAchievementProgress,
} from '../data/persistedAchievements';

export const profileAchievementsService = {
  /** Consulta con el token de origen y valida la respuesta antes de exponerla. */
  async getMine(
    token: string,
    signal: AbortSignal,
  ): Promise<PersistedAchievementProgress[]> {
    const res = await api.get<unknown>(ENDPOINTS.achievements, {
      // Old servers safely ignore this query and keep returning only legacy achievements.
      params: { catalogVersion: 2 },
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return parseAchievementsResponse(res.data);
  },
};