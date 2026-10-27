import { act, renderHook } from '@testing-library/react-native';
import { useMyStats } from '../hooks/useMyStats';
import { useMyAchievements } from '../hooks/useMyAchievements';
import { useChallengeRewardSummary } from '../hooks/useChallengeRewardSummary';
import { profileStatsService } from '../services/profileStats.service';
import { profileAchievementsService } from '../services/profileAchievements.service';
import { challengeRewardSummaryService } from '../services/challengeRewardSummary.service';

let mockToken: string | null = 'a';
let mockUser = 7;
let mockGeneration = 1;
let mockFocused = true;
const mockCurrent = (generation: number) => generation === mockGeneration;
jest.mock('../../../app/providers/AuthContext', () => ({ useAuth: () => ({
  user: { id_usuario: mockUser }, token: mockToken, isAuthenticated: !!mockToken,
  sessionGeneration: mockGeneration, isSessionCurrent: mockCurrent,
}) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback: () => void) => {
  require('react').useEffect(() => mockFocused ? callback() : undefined, [callback, mockFocused]);
} }));
jest.mock('../services/profileStats.service', () => ({ profileStatsService: { getMine: jest.fn() } }));
jest.mock('../services/profileAchievements.service', () => ({ profileAchievementsService: { getMine: jest.fn() } }));
jest.mock('../services/challengeRewardSummary.service', () => ({ challengeRewardSummaryService: { getMine: jest.fn() } }));

const pending = () => {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const cases = [
  { name: 'stats', hook: useMyStats, service: profileStatsService, field: 'stats', value: { totalTranslations: 23, distinctWords: 12, activeDays: 3 } },
  { name: 'achievements', hook: useMyAchievements, service: profileAchievementsService, field: 'achievements', value: [] },
  { name: 'rewards', hook: useChallengeRewardSummary, service: challengeRewardSummaryService, field: 'totalPoints', value: 0 },
];

beforeEach(() => {
  jest.clearAllMocks(); mockToken = 'a'; mockUser = 7; mockGeneration = 1; mockFocused = true;
});

describe.each(cases)('$name public contract', ({ hook, service, field, value }) => {
  const getMine = service.getMine as jest.Mock;
  const read = (result: object) => (result as Record<string, unknown>)[field];

  it('retains confirmed data during refresh and error, then allows retry', async () => {
    getMine.mockResolvedValueOnce(value);
    const view = await renderHook(() => hook());
    expect(read(view.result.current)).toEqual(value);
    const refresh = pending(); getMine.mockReturnValueOnce(refresh.promise);
    let request!: Promise<void>;
    await act(async () => { request = view.result.current.reload(); });
    expect(view.result.current.loading).toBe(true);
    expect(read(view.result.current)).toEqual(value);
    await act(async () => { refresh.reject(new Error('offline')); await request; });
    expect(view.result.current).toMatchObject({ loading: false, error: true });
    expect(read(view.result.current)).toEqual(value);
    getMine.mockResolvedValueOnce(value);
    await act(async () => { await view.result.current.reload(); });
    expect(view.result.current).toMatchObject({ loading: false, error: false });
  });

  it.each(['user', 'token', 'generation'])('isolates %s and rejects retained reloads and late errors', async change => {
    const old = pending(); getMine.mockReturnValueOnce(old.promise);
    const view = await renderHook(() => hook());
    const retained = view.result.current.reload;
    const signal = getMine.mock.calls[0][1];
    if (change === 'user') mockUser++;
    if (change === 'token') mockToken = 'b';
    if (change === 'generation') mockGeneration++;
    getMine.mockResolvedValueOnce(value); await view.rerender({});
    await act(async () => { old.reject(new Error('late')); await retained(); });
    expect(signal.aborted).toBe(true);
    expect(read(view.result.current)).toEqual(value);
    expect(view.result.current).toMatchObject({ loading: false, error: false });
    expect(getMine).toHaveBeenCalledTimes(2);
  });

  it('cancels on blur, refreshes on focus and cancels on unmount', async () => {
    const old = pending(); getMine.mockReturnValueOnce(old.promise);
    const view = await renderHook(() => hook());
    const retained = view.result.current.reload;
    const signal = getMine.mock.calls[0][1];
    mockFocused = false; await view.rerender({});
    expect(signal.aborted).toBe(true);
    await act(async () => { old.resolve(value); await retained(); });
    expect(getMine).toHaveBeenCalledTimes(1);
    const next = pending(); getMine.mockReturnValueOnce(next.promise);
    mockFocused = true; await view.rerender({});
    const nextSignal = getMine.mock.calls[1][1];
    await view.unmount();
    expect(nextSignal.aborted).toBe(true);
    await act(async () => { next.reject(new Error('after unmount')); await retained(); });
    expect(getMine).toHaveBeenCalledTimes(2);
  });

  it('clears confirmed data on logout while blurred without making another request', async () => {
    getMine.mockResolvedValueOnce(value);
    const view = await renderHook(() => hook());
    mockFocused = false; await view.rerender({});
    mockToken = null; mockGeneration++; await view.rerender({});
    expect(read(view.result.current)).toBeNull();
    expect(view.result.current).toMatchObject({ loading: false, error: false });
    expect(getMine).toHaveBeenCalledTimes(1);
  });
});

// Estos dos recursos dependen de elegibilidad; estadísticas no recibe enabled.
describe.each(cases.slice(1))('$name eligibility', ({ hook, service, field, value }) => {
  it('invalidates pending reads across disable and re-enable', async () => {
    const getMine = service.getMine as jest.Mock;
    const old = pending(); getMine.mockReturnValueOnce(old.promise);
    const view = await renderHook(({ enabled }: { enabled: boolean }) => hook(enabled), { initialProps: { enabled: true } });
    const retained = view.result.current.reload;
    const signal = getMine.mock.calls[0][1];
    await view.rerender({ enabled: false });
    expect(signal.aborted).toBe(true);
    expect((view.result.current as Record<string, unknown>)[field]).toBeNull();
    expect(view.result.current).toMatchObject({ loading: false, error: false });
    getMine.mockResolvedValueOnce(value); await view.rerender({ enabled: true });
    await act(async () => { old.resolve(9999); await retained(); });
    expect((view.result.current as Record<string, unknown>)[field]).toEqual(value);
    expect(getMine).toHaveBeenCalledTimes(2);
  });
});
