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
      // La capacidad explícita evita enviar la métrica nueva a clientes v2 anteriores.
      // Los servidores antiguos ignoran la opción y conservan su catálogo.
      params: { catalogVersion: 2, challengeRewards: 1 },
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return parseAchievementsResponse(res.data);
  },
};