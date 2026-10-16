import { act, renderHook } from '@testing-library/react-native';
import { useResendCooldown } from '../useResendCooldown';

describe('useResendCooldown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-16T12:00:00Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('sin marca de tiempo permite reenviar enseguida', async () => {
    const { result } = await renderHook(() => useResendCooldown(undefined));
    expect(result.current).toEqual({ seconds: 0, canResend: true });
  });

  it('una marca ya pasada permite reenviar', async () => {
    const availableAt = Date.now() - 5_000;
    const { result } = await renderHook(() => useResendCooldown(availableAt));
    expect(result.current.canResend).toBe(true);
  });

  it('cuenta hacia atrás cada segundo y habilita el reenvío al llegar a 0', async () => {
    const availableAt = Date.now() + 3_000;
    const { result } = await renderHook(() => useResendCooldown(availableAt));
    expect(result.current).toEqual({ seconds: 3, canResend: false });

    await act(async () => { jest.advanceTimersByTime(1_000); });
    expect(result.current.seconds).toBe(2);

    await act(async () => { jest.advanceTimersByTime(2_000); });
    expect(result.current).toEqual({ seconds: 0, canResend: true });
  });

  it('redondea hacia arriba los segundos parciales', async () => {
    const availableAt = Date.now() + 1_500;
    const { result } = await renderHook(() => useResendCooldown(availableAt));
    expect(result.current.seconds).toBe(2);
  });

  it('al remontar no reinicia el contador: usa la misma marca', async () => {
    const availableAt = Date.now() + 60_000;
    const first = await renderHook(() => useResendCooldown(availableAt));
    await act(async () => { jest.advanceTimersByTime(20_000); });
    await first.unmount();

    const second = await renderHook(() => useResendCooldown(availableAt));
    expect(second.result.current.seconds).toBe(40);
  });
});
