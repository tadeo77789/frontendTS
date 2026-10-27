import { challengeRewardSummaryService } from '../services/challengeRewardSummary.service';
import { useFocusedProfileResource } from './useFocusedProfileResource';

/** Conserva el total real confirmado; null no equivale a cero. */
export const useChallengeRewardSummary = (enabled = true) => {
  const { data, ...request } = useFocusedProfileResource(challengeRewardSummaryService.getMine, enabled);
  return { totalPoints: data, ...request };
};
