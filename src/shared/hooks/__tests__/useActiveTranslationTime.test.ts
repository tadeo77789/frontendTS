import { renderHook, act } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useActiveTranslationTime } from '../useActiveTranslationTime';

it('foreground heartbeats stop in background, pause on cleanup, and send no duration', async () => {
  jest.useFakeTimers();
  let change: (state: AppStateStatus) => void = () => {};
  const remove = jest.fn();
  const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    change = handler; return { remove };
  });
  const original = AppState.currentState;
  AppState.currentState = 'active';
  const record = jest.fn().mockResolvedValue(undefined);
  const cancel = jest.fn();
  const hook = await renderHook(() => useActiveTranslationTime(true,record,cancel));
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(record).toHaveBeenCalledWith({kind:'tick'});
  await act(() => change('background'));
  expect(record).toHaveBeenLastCalledWith({kind:'pause'});
  record.mockClear();
  await act(async () => { jest.advanceTimersByTime(60000); });
  expect(record).not.toHaveBeenCalled();
  await act(() => change('active'));
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(record).toHaveBeenCalledWith({kind:'tick'});
  await hook.unmount();
  expect(record).toHaveBeenLastCalledWith({kind:'pause'});
  expect(remove).toHaveBeenCalled();
  expect(cancel).toHaveBeenCalled();
  AppState.currentState = original;
  spy.mockRestore(); jest.useRealTimers();
});

it('disabled translator produces no active time events', async () => {
  jest.useFakeTimers();
  const record=jest.fn().mockResolvedValue(undefined);
  const hook=await renderHook(()=>useActiveTranslationTime(false,record,jest.fn()));
  await act(async()=>{jest.advanceTimersByTime(60000);});
  expect(record).not.toHaveBeenCalled(); await hook.unmount(); jest.useRealTimers();
});
