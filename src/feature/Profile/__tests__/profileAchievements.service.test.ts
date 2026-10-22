import { api } from '../../../shared/services/api.client';
import { profileAchievementsService } from '../services/profileAchievements.service';
import { catalogue, legacy, translationMilestones } from './fixtures';

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

it.each([1,2])('preserves the three real identifiers and progress with a v%s server', async version => {
  const items = [legacy(), legacy('TEN_TRANSLATIONS',10), legacy('FIFTY_TRANSLATIONS',50)];
  items[0].currentCount = 1; items[0].achievedAt = '2026-01-01T00:00:00.000Z';
  items[1].currentCount = 7; items[2].currentCount = 7;
  const data = version === 2 ? items : items.map(({ achievement, ...progress }) => {
    const { collection, availability, category, level, localizations, ...old } = achievement;
    return { ...progress, achievement: old };
  });
  get.mockResolvedValue({ data: { data, ...(version === 2 ? { meta: { catalogVersion: 2 } } : {}) } });
  const result = await profileAchievementsService.getMine('token', new AbortController().signal);
  expect(result).toEqual(items);
  expect(result.map(p => p.achievement.id)).toEqual(['FIRST_TRANSLATION','TEN_TRANSLATIONS','FIFTY_TRANSLATIONS']);
});

it.each([1,2])('reads all five measured achievements from a v%s response without fabricating history', async version => {
  const items = translationMilestones();
  items[0].currentCount = 1; items[0].achievedAt = '2026-01-01T00:00:00.000Z';
  items[3].currentCount = 99; items[4].currentCount = 999;
  const data = version === 2 ? items : items.map(({ achievement, ...progress }) => {
    const { collection,availability,category,level,localizations,...measured } = achievement;
    return { ...progress,achievement: measured };
  });
  get.mockResolvedValue({ data: { data, ...(version === 2 ? { meta: { catalogVersion: 2 } } : {}) } });
  const result = await profileAchievementsService.getMine('token',new AbortController().signal);
  expect(result).toHaveLength(5);
  expect(result.map(p => [p.achievement.id,p.achievement.targetCount,p.currentCount,p.achievedAt]))
    .toEqual(items.map(p => [p.achievement.id,p.achievement.targetCount,p.currentCount,p.achievedAt]));
  expect(result.every(p => p.achievement.metric === 'TRANSLATIONS_COMPLETED' && p.achievement.availability === 'available')).toBe(true);
  expect(result.slice(3).map(p => p.achievement.points)).toEqual([0,0]);
});
