import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useDailyChallenge, bogotaDay, untilBogotaMidnight } from '../hooks/useDailyChallenge';
import { dailyChallengeService } from '../services/dailyChallenge.service';
import { translationSaved } from '../../../shared/services/translationSaved';
let mockToken: string | null = 'a';
let mockUser = 7; let mockGeneration = 1; let mockAdmin = false; let mockAccessLoading = false; let mockAccessError = false;
let mockLanguage = 'es'; let mockFocused = true;
const mockCurrent = (generation: number) => generation === mockGeneration;
jest.mock('../../../app/providers/AuthContext', () => ({ useAuth: () => ({
  user:{ id_usuario:mockUser }, token:mockToken,isAuthenticated:!!mockToken,sessionGeneration:mockGeneration,isSessionCurrent:mockCurrent,
}) }));
jest.mock('../../../app/providers/AccessContext', () => ({ useAccess: () => ({ permissions:mockAdmin ? ['users.manage'] : [],isLoading:mockAccessLoading,error:mockAccessError }) }));
jest.mock('../../../app/providers/LanguageContext', () => ({ useLanguage: () => ({ language:mockLanguage }) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback: () => void) => {
  const React = require('react'); React.useEffect(() => mockFocused ? callback() : undefined,[callback,mockFocused]);
} }));
jest.mock('../services/dailyChallenge.service', () => ({ dailyChallengeService:{ today:jest.fn() } }));
const today = dailyChallengeService.today as jest.Mock;
const data = (currentCount = 0) => ({ challengeId:'id',code:'TRANSLATE_3',name:'Saved',description:'Confirmed',targetCount:3,currentCount,points:10,completed:false,completedAt:null,date:bogotaDay(Date.now()) });
let mockResume: (state: string) => void;
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date('2026-10-25T12:00:00Z')); jest.clearAllMocks();
  mockToken='a';mockUser=7;mockGeneration=1;mockAdmin=false;mockAccessLoading=false;mockAccessError=false;mockLanguage='es';mockFocused=true;
  today.mockImplementation(async () => data());
  jest.spyOn(AppState,'addEventListener').mockImplementation((_,callback: any) => { mockResume=callback; return { remove:jest.fn() }; });
  Object.defineProperty(AppState,'currentState',{ configurable:true,value:'active' });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
it('fecha y siguiente medianoche usan Bogotá', () => {
  const boundary = Date.parse('2026-10-25T04:59:59Z');
  expect(bogotaDay(boundary)).toBe('2026-10-24'); expect(untilBogotaMidnight(boundary)).toBe(1000);
  expect(bogotaDay(boundary+1000)).toBe('2026-10-25');
});
it('actualiza eventualmente tras guardado con cuatro consultas acotadas; no consulta otras sesiones', async () => {
  const view = await renderHook(() => useDailyChallenge());
  expect(view.result.current.data?.currentCount).toBe(0);
  await act(async () => { translationSaved.emit({ token:'other',userId:7 }); translationSaved.emit({ token:'a',userId:8 }); jest.advanceTimersByTime(12000); });
  expect(today).toHaveBeenCalledTimes(1);
  await act(async () => { translationSaved.emit({ token:'a',userId:7 }); });
  for (const ms of [800,1700,3500,6000]) {
    today.mockResolvedValueOnce(data(ms===6000 ? 2 : 0));
    await act(async () => { jest.advanceTimersByTime(ms); });
  }
  expect(today).toHaveBeenCalledTimes(5); expect(view.result.current.data?.currentCount).toBe(2);
  await act(async () => { jest.advanceTimersByTime(60000); });
  expect(today).toHaveBeenCalledTimes(5);
});
it('ráfagas de guardados reinician la ventana y cancelan la consulta anterior', async () => {
  const view = await renderHook(() => useDailyChallenge());
  const signal = today.mock.calls[0][1];
  await act(async () => { translationSaved.emit({ token:'a',userId:7 }); jest.advanceTimersByTime(500); translationSaved.emit({ token:'a',userId:7 }); jest.advanceTimersByTime(500); });
  expect(signal.aborted).toBe(true); expect(today).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(300); }); expect(today).toHaveBeenCalledTimes(2);
  await view.unmount();
  await act(async () => { jest.advanceTimersByTime(20000); }); expect(today).toHaveBeenCalledTimes(2);
});
it.each(['guest','admin','access-loading','access-error'])('no pide datos privados para %s', async mode => {
  mockToken=mode==='guest' ? null : 'a';mockAdmin=mode==='admin';mockAccessLoading=mode==='access-loading';mockAccessError=mode==='access-error';
  const view = await renderHook(() => useDailyChallenge());
  expect(view.result.current.enabled).toBe(false); expect(today).not.toHaveBeenCalled();
});
it('descarta respuestas tardías incluso si cambia usuario con el mismo token', async () => {
  let finish!: (value: unknown) => void;
  today.mockReturnValueOnce(new Promise(resolve => { finish=resolve; }));
  const view = await renderHook(() => useDailyChallenge());
  const signal=today.mock.calls[0][1];
  mockUser=8;mockGeneration=2; today.mockResolvedValue(null);
  await view.rerender({});
  await act(async () => { finish(data(2)); });
  expect(signal.aborted).toBe(true); expect(view.result.current.data).toBeNull();
});
it('logout cancela peticiones y reintentos; ningún dato anterior queda visible', async () => {
  const view = await renderHook(() => useDailyChallenge());
  await act(async () => { translationSaved.emit({ token:'a',userId:7 }); });
  mockToken=null;mockGeneration++;
  await view.rerender({});
  await act(async () => { jest.advanceTimersByTime(15000); });
  expect(view.result.current.data).toBeNull();expect(view.result.current.enabled).toBe(false);expect(today).toHaveBeenCalledTimes(1);
});
it('actualiza al recuperar foco, al reanudar y al cambiar idioma', async () => {
  const view = await renderHook(() => useDailyChallenge());
  await act(async () => { mockResume('active'); }); expect(today).toHaveBeenCalledTimes(2);
  mockFocused=false; await view.rerender({}); mockFocused=true; await view.rerender({});
  expect(today).toHaveBeenCalledTimes(3);
  mockLanguage='fr'; await view.rerender({}); expect(today).toHaveBeenCalledTimes(4);
});
it('medianoche elimina datos anteriores y solicita el nuevo día', async () => {
  jest.setSystemTime(new Date('2026-10-25T04:59:59Z'));
  const view = await renderHook(() => useDailyChallenge());
  expect(view.result.current.data?.date).toBe('2026-10-24');
  await act(async () => { jest.advanceTimersByTime(1100); });
  expect(today).toHaveBeenCalledTimes(2);expect(view.result.current.data?.date).toBe('2026-10-25');
});
it('maneja null, error y reintento', async () => {
  today.mockRejectedValueOnce(new Error('network'));
  const view = await renderHook(() => useDailyChallenge());
  expect(view.result.current.error).toBe(true);
  today.mockResolvedValueOnce(null);
  await act(async () => { view.result.current.retry(); });
  expect(view.result.current.error).toBe(false);expect(view.result.current.loading).toBe(false);expect(view.result.current.data).toBeNull();
});
