import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, StyleSheet } from 'react-native';
import { AchievementUnlockAlerts, achievementAlertPosition } from '../AchievementUnlockAlerts';
import { api } from '../../services/api.client';
import { profileAchievementsService } from '../../../feature/Profile/services/profileAchievements.service';
let mockWidth = 390;
let mockOS = 'ios';
jest.mock('react-native', () => {
 const actual = jest.requireActual('react-native');
 const mocked = Object.create(actual);
 Object.defineProperty(mocked, 'Platform', { value: { ...actual.Platform, get OS() { return mockOS; } } });
 Object.defineProperty(mocked, 'useWindowDimensions', { value: () => ({ width: mockWidth, height: 900, scale: 1, fontScale: 1 }) });
 return mocked;
});
let mockEnabled = true;
let mockAdmin = false;
let mockToken = 'a';
let mockGeneration = 1;
const mockCurrent = (generation: number) => generation === mockGeneration;
jest.mock('../../../app/providers/AuthContext', () => ({ useAuth: () => ({ token: mockToken, sessionGeneration: mockGeneration, isSessionCurrent: mockCurrent }) }));
jest.mock('../../../app/providers/AccessContext', () => ({ useAccess: () => ({ permissions: mockAdmin ? ['users.manage'] : [], isLoading: false, error: false }) }));
jest.mock('../../../app/providers/PreferencesContext', () => ({ usePreferences: () => ({ preferences: { notificationsEnabled: mockEnabled }, loading: false, saving: false, error: null }) }));
jest.mock('../../../app/providers/ThemeContext', () => ({ useColors: () => ({ surface: 'white', primary: 'blue', textPrimary: 'black' }) }));
jest.mock('../../../app/config/i18n', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 34, left: 20, right: 16 }) }));
jest.mock('../../../feature/Profile/hooks/useAchievementText', () => ({ useAchievementText: () => ({ textOf: (p: any) => ({ name: p.achievement.name }) }) }));
jest.mock('../../../feature/Profile/components/AchievementMedal', () => ({ AchievementMedal: () => null }));
jest.mock('../../../feature/Profile/services/profileAchievements.service', () => ({ profileAchievementsService: { getMine: jest.fn() } }));
jest.mock('../../services/api.client', () => ({ api: { get: jest.fn(), patch: jest.fn() } }));
const progress = (id: string, achievedAt: string | null = '2026-10-23T12:00:00.000Z') => ({ achievement: { id, name: id, isActive: true, availability: 'available' }, currentCount: 100, achievedAt });
const notification = (id: string) => ({ id: `notification-${id}`, referenceId: id, referenceType: 'ACHIEVEMENT', channel: 'IN_APP', status: 'SENT' });
const tick = async () => { await act(async () => { jest.advanceTimersByTime(20000); }); };
beforeEach(() => {
 jest.useFakeTimers(); jest.clearAllMocks(); mockWidth = 390; mockOS = 'ios';
 jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() }); mockEnabled = true; mockAdmin = false; mockToken = 'a'; mockGeneration = 1;
 Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([]);
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
 (api.patch as jest.Mock).mockResolvedValue({});
});
afterEach(() => jest.useRealTimers());
it('does not announce historical achievements or a counter without achievedAt', async () => {
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('old'), progress('counter', null)]);
 await render(<AchievementUnlockAlerts />);
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('old'), notification('counter')] } });
 await tick();
 expect(screen.queryByText('achievementUnlocked')).toBeNull();
 expect(api.patch).not.toHaveBeenCalled();
});
it('queues confirmed unlocks, closes one at a time and deduplicates repeated responses', async () => {
 await render(<AchievementUnlockAlerts />);
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('one'), progress('two')]);
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('two'), notification('one'), notification('one')] } });
 await tick();
 expect(screen.getByText('one')).toBeTruthy();
 expect(screen.queryByText('two')).toBeNull();
 expect(api.patch).toHaveBeenCalledTimes(1);
 await fireEvent.press(screen.getByLabelText('close'));
 expect(screen.getByText('two')).toBeTruthy();
 expect(api.patch).toHaveBeenCalledTimes(2);
 await fireEvent.press(screen.getByLabelText('close'));
 await tick();
 expect(screen.queryByText('achievementUnlocked')).toBeNull();
 expect(api.patch).toHaveBeenCalledTimes(2);
});
it.each(['disabled', 'admin'])('does not request alerts when %s', async mode => {
 mockEnabled = mode !== 'disabled'; mockAdmin = mode === 'admin';
 await render(<AchievementUnlockAlerts />); await tick();
 expect(profileAchievementsService.getMine).not.toHaveBeenCalled(); expect(api.get).not.toHaveBeenCalled();
});
it('reactivation establishes a fresh baseline rather than replaying accumulated unlocks', async () => {
 mockEnabled = false;
 const view = await render(<AchievementUnlockAlerts />);
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('offline')]);
 mockEnabled = true; await view.rerender(<AchievementUnlockAlerts />);
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('offline')] } });
 await tick(); expect(api.patch).not.toHaveBeenCalled();
});
it('drops a response from a replaced token/session', async () => {
 const view = await render(<AchievementUnlockAlerts />);
 let finish!: (v: unknown) => void;
 (api.get as jest.Mock).mockReturnValue(new Promise(resolve => { finish = resolve; }));
 await tick();
 mockToken = 'b'; mockGeneration++;
 await view.rerender(<AchievementUnlockAlerts />);
 await act(async () => { finish({ data: { data: [notification('late')] } }); });
 expect(api.patch).not.toHaveBeenCalled(); expect(screen.queryByText('late')).toBeNull();
});
it('a connection failure discards the queue and establishes a new baseline', async () => {
 await render(<AchievementUnlockAlerts />);
 (api.get as jest.Mock).mockRejectedValueOnce(new Error('offline'));
 await tick();
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('offline')]);
 await tick();
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('offline')] } });
 await tick(); expect(api.patch).not.toHaveBeenCalled();
});
it('clears queued cards on logout and aborts the acknowledgement of the visible card', async () => {
 const view = await render(<AchievementUnlockAlerts />);
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('one'), progress('two')]);
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('two'), notification('one')] } });
 await tick();
 const signal = (api.patch as jest.Mock).mock.calls[0][2].signal as AbortSignal;
 mockToken = ''; mockGeneration++;
 await view.rerender(<AchievementUnlockAlerts />);
 expect(signal.aborted).toBe(true);
 expect(screen.queryByText('one')).toBeNull();
 await tick(); expect(api.patch).toHaveBeenCalledTimes(1);
});
it('resuming after background establishes a baseline and does not replay the interval', async () => {
 let change!: (state: string) => void;
 const listener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback: any) => {
   change = callback; return { remove: jest.fn() };
 });
 await render(<AchievementUnlockAlerts />);
 Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'background' });
 await act(async () => { change('background'); });
 await tick(); expect(api.get).not.toHaveBeenCalled();
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('away')]);
 Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
 await act(async () => { change('active'); });
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('away')] } });
 await tick(); expect(api.patch).not.toHaveBeenCalled();
 listener.mockRestore();
});

it.each([
 [1280, true, 34, 'flex-end'],
 [390, false, 102, 'center'],
 [800, false, 120, 'center'],
])('reserves navigation and safe areas at %s px', (width, wide, bottom, alignItems) => {
 expect(achievementAlertPosition(Number(width), { bottom: 34, left: 20, right: 16 }, Boolean(wide)))
   .toEqual({ bottom, left: 20, right: 16, alignItems });
});
it('applies the mobile position to the visible overlay', async () => {
 await render(<AchievementUnlockAlerts />);
 (profileAchievementsService.getMine as jest.Mock).mockResolvedValue([progress('one')]);
 (api.get as jest.Mock).mockResolvedValue({ data: { data: [notification('one')] } });
 await tick();
 expect(StyleSheet.flatten(screen.getByTestId('achievement-alert-overlay').props.style))
   .toEqual(expect.objectContaining({ bottom: 102, left: 20, right: 16, alignItems: 'center' }));
});
