import { challengeRewardSummaryService } from '../services/challengeRewardSummary.service';
import { api } from '../../../shared/services/api.client';
jest.mock('../../../shared/services/api.client', () => ({ api: { get: jest.fn() } }));
const get = api.get as jest.Mock;
beforeEach(() => jest.clearAllMocks());
it.each([0, 5245])('accepts confirmed total %s and passes token/cancellation', async totalPoints => {
  const controller = new AbortController();
  get.mockResolvedValue({ data: { success: true, data: { totalPoints } } });
  expect(await challengeRewardSummaryService.getMine('account-token', controller.signal)).toBe(totalPoints);
  expect(get).toHaveBeenCalledWith('/profile/challenges/rewards/summary', {
    headers: { Authorization: 'Bearer account-token' }, signal: controller.signal,
  });
});
it.each([undefined, null, {}, { success: true, data: {} },
  ...[-1, 1.5, '25', null, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(totalPoints => ({ success: true, data: { totalPoints } })),
  { success: false, data: { totalPoints: 0 } },
])('rejects invalid/old response rather than inventing zero (%j)', async data => {
  get.mockResolvedValue({ data });
  await expect(challengeRewardSummaryService.getMine('a', new AbortController().signal)).rejects.toThrow();
});
it('propagates transport failure', async () => {
  get.mockRejectedValue(new Error('offline'));
  await expect(challengeRewardSummaryService.getMine('a', new AbortController().signal)).rejects.toThrow('offline');
});
