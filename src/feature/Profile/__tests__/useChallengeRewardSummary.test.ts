import { act, renderHook } from '@testing-library/react-native';
import { useChallengeRewardSummary } from '../hooks/useChallengeRewardSummary';
import { challengeRewardSummaryService } from '../services/challengeRewardSummary.service';
let mockToken: string | null = 'a'; let mockUser = 7; let mockGeneration = 1; let mockFocused = true;
const mockCurrent = (generation: number) => generation === mockGeneration;
jest.mock('../../../app/providers/AuthContext', () => ({ useAuth: () => ({
  user: { id_usuario: mockUser }, token: mockToken, isAuthenticated: !!mockToken,
  sessionGeneration: mockGeneration, isSessionCurrent: mockCurrent,
}) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback: () => void) => {
  require('react').useEffect(() => mockFocused ? callback() : undefined, [callback, mockFocused]);
} }));
jest.mock('../services/challengeRewardSummary.service', () => ({ challengeRewardSummaryService: { getMine: jest.fn() } }));
const getMine = challengeRewardSummaryService.getMine as jest.Mock;
const deferred = () => { let resolve!: (v: number) => void; let reject!: (v: Error) => void;
  const promise = new Promise<number>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
beforeEach(() => { jest.clearAllMocks(); mockToken = 'a'; mockUser = 7; mockGeneration = 1; mockFocused = true; getMine.mockResolvedValue(0); });
it('keeps loading separate from confirmed zero and refreshes after returning with new rewards', async () => {
  const initial = deferred(); getMine.mockReturnValueOnce(initial.promise);
  const view = await renderHook(() => useChallengeRewardSummary());
  expect(view.result.current).toMatchObject({ totalPoints: null, loading: true, error: false });
  await act(async () => { initial.resolve(0); });
  expect(view.result.current).toMatchObject({ totalPoints: 0, loading: false, error: false });
  mockFocused = false; await view.rerender({});
  const signal = getMine.mock.calls[0][1];
  getMine.mockResolvedValueOnce(25); mockFocused = true; await view.rerender({});
  expect(view.result.current.totalPoints).toBe(25); expect(getMine).toHaveBeenCalledTimes(2);
  // A completed request need not remain attached to its controller.
  expect(signal).toBeInstanceOf(AbortSignal);
});
it.each(['user', 'token', 'generation'])('rejects late responses on %s change even if cancellation is ignored', async change => {
  const old = deferred(); getMine.mockReturnValueOnce(old.promise);
  const view = await renderHook(() => useChallengeRewardSummary());
  const signal = getMine.mock.calls[0][1]; const retained = view.result.current.reload;
  if (change === 'user') mockUser = 8;
  if (change === 'token') mockToken = 'b';
  if (change === 'generation') mockGeneration++;
  getMine.mockResolvedValueOnce(50); await view.rerender({});
  await act(async () => { old.resolve(9999); await retained(); });
  expect(signal.aborted).toBe(true); expect(view.result.current.totalPoints).toBe(50);
  expect(getMine).toHaveBeenCalledTimes(2);
});
it('blocks queries when disabled and cancels a pending read when disabled/logout', async () => {
  const view = await renderHook(({ enabled }: { enabled: boolean }) => useChallengeRewardSummary(enabled), { initialProps: { enabled: false } });
  await act(async () => { await view.result.current.reload(); }); expect(getMine).not.toHaveBeenCalled();
  const old = deferred(); getMine.mockReturnValueOnce(old.promise); await view.rerender({ enabled: true });
  const signal = getMine.mock.calls[0][1]; await view.rerender({ enabled: false });
  await act(async () => { old.resolve(100); });
  expect(signal.aborted).toBe(true); expect(view.result.current.totalPoints).toBeNull();
  mockToken = null; mockGeneration++; await view.rerender({ enabled: true });
  expect(getMine).toHaveBeenCalledTimes(1); expect(view.result.current.totalPoints).toBeNull();
});
it('aborts on blur and prevents late errors from another request replacing a successful retry', async () => {
  const first = deferred(); getMine.mockReturnValueOnce(first.promise);
  const view = await renderHook(() => useChallengeRewardSummary());
  const signal = getMine.mock.calls[0][1]; mockFocused = false; await view.rerender({});
  expect(signal.aborted).toBe(true);
  mockFocused = true; getMine.mockResolvedValueOnce(75); await view.rerender({});
  await act(async () => { first.reject(new Error('late')); });
  expect(view.result.current).toMatchObject({ totalPoints: 75, error: false, loading: false });
});
it('exposes an error without zero and supports retry', async () => {
  getMine.mockRejectedValueOnce(new Error('offline'));
  const view = await renderHook(() => useChallengeRewardSummary());
  expect(view.result.current).toMatchObject({ totalPoints: null, error: true, loading: false });
  getMine.mockResolvedValueOnce(5); await act(async () => { await view.result.current.reload(); });
  expect(view.result.current).toMatchObject({ totalPoints: 5, error: false, loading: false });
});
