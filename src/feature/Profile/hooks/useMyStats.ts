import { profileStatsService } from '../services/profileStats.service';
import { useFocusedProfileResource } from './useFocusedProfileResource';

/** Las estadísticas mantienen su lectura independiente de la elegibilidad de logros. */
export const useMyStats = () => {
  const { data, ...request } = useFocusedProfileResource(profileStatsService.getMine);
  return { stats: data, ...request };
};
