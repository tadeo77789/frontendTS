import { profileAchievementsService } from '../services/profileAchievements.service';
import { useFocusedProfileResource } from './useFocusedProfileResource';

/** La elegibilidad se decide en el consumidor mediante enabled. */
export const useMyAchievements = (enabled = true) => {
  const { data, ...request } = useFocusedProfileResource(profileAchievementsService.getMine, enabled);
  return { achievements: data, ...request };
};
