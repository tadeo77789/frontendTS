import { api } from '../../../shared/services/api.client';
import { profileAchievementsService } from '../services/profileAchievements.service';
import { catalogue, legacy } from './fixtures';

jest.mock('../../../shared/services/api.client', () => ({ api: { get: jest.fn() } }));
const get = api.get as jest.Mock;
beforeEach(() => get.mockReset());

it('opts in to v2 without changing authentication or cancellation', async () => {
  const signal = new AbortController().signal;
  get.mockResolvedValue({ data: { data: catalogue(), meta: { catalogVersion: 2 } } });
  const result = await profileAchievementsService.getMine('token-a', signal);
  expect(result).toHaveLength(24);
  expect(get).toHaveBeenCalledWith(expect.any(String), {
    params: { catalogVersion: 2 }, headers: { Authorization: 'Bearer token-a' }, signal,
  });
});
it('accepts the old server ignoring the opt-in before and after the migration', async () => {
  const { collection, availability, category, level, localizations, ...achievement } = legacy().achievement;
  get.mockResolvedValue({ data: { data: [{ achievement, currentCount: 0, achievedAt: null }] } });
  const result = await profileAchievementsService.getMine('token-a', new AbortController().signal);
  expect(result).toHaveLength(1);
  expect(result[0].achievement.collection).toBe('legacy');
  expect(result[0].currentCount).toBe(0); // Actual measured legacy progress, not a new placeholder.
});
it('never retries an invalid v2 response as invented progress', async () => {
  const item = catalogue()[0]; item.currentCount = 0;
  get.mockResolvedValue({ data: { data: [item], meta: { catalogVersion: 2 } } });
  await expect(profileAchievementsService.getMine('token-a', new AbortController().signal)).rejects.toThrow();
  expect(get).toHaveBeenCalledTimes(1);
});
