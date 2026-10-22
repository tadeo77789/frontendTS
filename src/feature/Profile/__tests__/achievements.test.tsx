import React from 'react';
import { act, render, renderHook, fireEvent, screen } from '@testing-library/react-native';
import { Colors, DarkColors, GreenColors, GreenDarkColors } from '../../../shared/constants/colors';
import { AchievementsCard } from '../components/AchievementsCard';
import { useMyAchievements } from '../hooks/useMyAchievements';
import { profileAchievementsService } from '../services/profileAchievements.service';
import { ProfileScreen } from '../pages/ProfileScreen';
import { catalogue, legacy, translationMilestones, functionalAchievements } from './fixtures';

jest.setTimeout(30000);

let mockColors: typeof Colors | typeof DarkColors | typeof GreenColors | typeof GreenDarkColors = Colors;
let mockLanguage = 'es';
let mockGeneration = 1;
let mockAuth = { user: { id_usuario: 1, nombre: 'Alice', email: 'alice@test.invalid' }, token: 'a', isAuthenticated: true,
  sessionGeneration: 1, isSessionCurrent: (generation: number) => generation === mockGeneration, logout: jest.fn() };
let mockAdmin = false;
let mockAccessLoading = false;
let mockAccessError = false;
jest.mock('../../../app/providers/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../../app/providers/ThemeContext', () => ({ useColors: () => mockColors,
  useTheme: () => ({ isDark: false, colorAccent: 'purple', toggleTheme: jest.fn(), setColorAccent: jest.fn() }) }));
jest.mock('../../../app/providers/LanguageContext', () => ({ useLanguage: () => ({ language: 'es', setLanguage: jest.fn() }) }));
jest.mock('../../../app/providers/PreferencesContext', () => ({ usePreferences: () => ({ preferences: {}, saveChanges: jest.fn() }) }));
jest.mock('../../../app/providers/AccessContext', () => ({ useAdminMode: () => ({ adminMode: mockAdmin }),
  useAccess: () => ({ hasPermission: () => false, isLoading: mockAccessLoading, error: mockAccessError }) }));
jest.mock('../../../app/config/i18n', () => {
  const locales: Record<string, Record<string, string>> = { es: require('../../../app/config/i18n/locales/es').default, en: require('../../../app/config/i18n/locales/en').default, fr: require('../../../app/config/i18n/locales/fr').default, pt: require('../../../app/config/i18n/locales/pt').default };
  return { useTranslation: () => ({ language: mockLanguage, t: (key: string, params?: Record<string, string | number>) =>
    (locales[mockLanguage][key] ?? key).replace(/\{(\w+)\}/g, (_: string, k: string) => String(params?.[k] ?? k)),
  }) };
});
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: (props: any) => require('react').createElement(require('react-native').View, props) }));
jest.mock('../../../shared/components/common/AppHeader', () => ({ AppHeader: () => null }));
jest.mock('../components/DeleteAccountModal', () => ({ DeleteAccountModal: () => null }));
jest.mock('../../../shared/utils/dialogs', () => ({ showAlert: jest.fn(), showConfirm: jest.fn() }));
jest.mock('../hooks/useMyStats', () => ({ useMyStats: () => ({ stats: null, loading: false, error: false, reload: jest.fn() }) }));
jest.mock('../services/profileAchievements.service', () => ({ profileAchievementsService: { getMine: jest.fn() } }));
const getMine = profileAchievementsService.getMine as jest.Mock;
const pending = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };

beforeEach(() => { jest.clearAllMocks(); mockLanguage = 'es'; mockColors = Colors; mockGeneration = 1;
  mockAuth = { ...mockAuth, user: { ...mockAuth.user, id_usuario: 1 }, token: 'a', sessionGeneration: 1 };
  mockAdmin = false; mockAccessLoading = false; mockAccessError = false;
  getMine.mockResolvedValue(catalogue());
});

it('summarizes categories and reveals all 24 without fake bars; retains details', async () => {
  const items = catalogue();
  const view = await render(<AchievementsCard achievements={items} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  expect(screen.getAllByText('Próximamente')).toHaveLength(10);
  for (const control of screen.getAllByRole('button').filter(button => button.props.accessibilityState?.expanded === false)) await fireEvent.press(control);
  expect(screen.getAllByText('Próximamente')).toHaveLength(24);
  expect(screen.getAllByText('Este logro estará disponible en una próxima actualización.')).toHaveLength(24);
  expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
  for (const category of ['Traducción (7)','Práctica (7)','Vocabulario (5)','Constancia (3)','Comunidad (2)']) expect(screen.getByText(category)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('firstSign · Próximamente'));
  expect(screen.getAllByText('Requirement: firstSign').length).toBeGreaterThan(0);
  expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
});

it.each([Colors, DarkColors, GreenColors, GreenDarkColors])('keeps pending tiles grey and completed tiles accented for each palette', async colors => {
  mockColors = colors;
  const p = legacy(); p.currentCount = 1;
  const completed = legacy('TEN_TRANSLATIONS',10); completed.currentCount = 10; completed.achievedAt = '2026-01-01T00:00:00.000Z';
  const view = await render(<AchievementsCard achievements={[p,completed]} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  expect(screen.getByLabelText('FIRST_TRANSLATION · Pendiente')).toHaveStyle({ backgroundColor: colors.backgroundGray });
  expect(screen.getByLabelText('TEN_TRANSLATIONS · Completado')).toHaveStyle({ backgroundColor: colors.primaryBg, borderColor: colors.primary });
  expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  expect(screen.getAllByRole('progressbar')[0].props.accessibilityValue.now).toBe(50);
  expect(screen.getByTestId('achievement-medal-FIRST_TRANSLATION')).toHaveStyle({ backgroundColor: colors.inputBg });
  expect(screen.getByTestId('achievement-medal-TEN_TRANSLATIONS')).toHaveStyle({ backgroundColor: colors.primaryBg });
});

it('blocks queries and manual reload when disabled, including a retained reload', async () => {
  const view = await renderHook(({ enabled }: { enabled: boolean }) => useMyAchievements(enabled), { initialProps: { enabled: false } });
  await act(async () => { await view.result.current.reload(); });
  expect(getMine).not.toHaveBeenCalled();
  await view.rerender({ enabled: true });
  const retained = view.result.current.reload;
  await view.rerender({ enabled: false });
  const calls = getMine.mock.calls.length;
  await act(async () => { await retained(); });
  expect(getMine).toHaveBeenCalledTimes(calls);
  expect(view.result.current.achievements).toBeNull();
});

it('rejects late account A responses after account B is current', async () => {
  const a = pending<ReturnType<typeof catalogue>>(); const b = pending<ReturnType<typeof catalogue>>();
  getMine.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  const view = await renderHook(() => useMyAchievements());
  const oldSignal = getMine.mock.calls[0][1] as AbortSignal;
  mockGeneration = 2; mockAuth = { ...mockAuth, user: { ...mockAuth.user, id_usuario: 2 }, token: 'b', sessionGeneration: 2 };
  await view.rerender(undefined);
  expect(oldSignal.aborted).toBe(true);
  expect(view.result.current.achievements).toBeNull();
  await act(async () => { a.resolve([legacy('ALICE_ONLY')]); });
  expect(view.result.current.achievements).toBeNull();
  await act(async () => { b.resolve([legacy('BOB_ONLY')]); });
  expect(view.result.current.achievements?.[0].achievement.code).toBe('BOB_ONLY');
});

it('closes account A detail when the account changes', async () => {
  const view = await render(<AchievementsCard achievements={catalogue()} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  await fireEvent.press(screen.getByLabelText('firstSign · Próximamente'));
  expect(screen.getAllByText('Requirement: firstSign').length).toBeGreaterThan(0);
  mockGeneration = 2; mockAuth = { ...mockAuth, token: 'b', sessionGeneration: 2, user: { ...mockAuth.user, id_usuario: 2 } };
  await view.rerender(<AchievementsCard achievements={null} loading error={false} reload={jest.fn()} isWide />);
  expect(screen.queryByText('Requirement: firstSign')).toBeNull();
});

it.each(['admin','loading','error'])('hides section and counter and does not query when access is %s', async state => {
  mockAdmin = state === 'admin'; mockAccessLoading = state === 'loading'; mockAccessError = state === 'error';
  await render(<ProfileScreen />);
  expect(screen.queryByText('Logros')).toBeNull();
  expect(screen.queryByText('Logros disponibles')).toBeNull();
  expect(screen.queryByText('Próximamente')).toBeNull();
  expect(getMine).not.toHaveBeenCalled();
});


it('expands and collapses each category independently and keeps legacy achievements visible', async () => {
  await render(<AchievementsCard achievements={[...catalogue(), legacy(), legacy('TEN_TRANSLATIONS', 10), legacy('FIFTY_TRANSLATIONS', 50)]} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  expect(screen.getAllByText('Próximamente')).toHaveLength(10);
  expect(screen.getByLabelText('FIFTY_TRANSLATIONS · Pendiente')).toBeTruthy();
  const more = screen.getByLabelText('Ver más (5) · Traducción');
  expect(more.props.accessibilityState).toEqual({ expanded: false });
  await fireEvent.press(more);
  expect(screen.getAllByText('Próximamente')).toHaveLength(15);
  expect(screen.getByText('Traducción (7)')).toBeTruthy();
  expect(screen.getByLabelText('Ver más (5) · Práctica').props.accessibilityState).toEqual({ expanded: false });
  const less = screen.getByLabelText('Ver menos · Traducción');
  expect(less.props.accessibilityState).toEqual({ expanded: true });
  await fireEvent.press(less);
  expect(screen.getAllByText('Próximamente')).toHaveLength(10);
  expect(screen.getByText('Comunidad (2)')).toBeTruthy();
  expect(screen.queryByLabelText(/Ver más.*Comunidad/)).toBeNull();
  expect(screen.getByLabelText('FIFTY_TRANSLATIONS · Pendiente')).toBeTruthy();
});

it('resets expanded categories when changing accounts without unmounting', async () => {
  const props = { achievements: catalogue(), loading: false, error: false, reload: jest.fn(), isWide: true };
  const view = await render(<AchievementsCard {...props} />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  await fireEvent.press(screen.getByLabelText('Ver más (5) · Traducción'));
  expect(screen.getAllByText('Próximamente')).toHaveLength(15);
  mockGeneration = 2;
  mockAuth = { ...mockAuth, token: 'b', sessionGeneration: 2, user: { ...mockAuth.user, id_usuario: 2 } };
  await view.rerender(<AchievementsCard {...props} />);
  expect(screen.queryByText('Próximamente')).toBeNull();
  expect(screen.getByLabelText('Expandir logros').props.accessibilityState).toEqual({ expanded: false });
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  expect(screen.getAllByText('Próximamente')).toHaveLength(10);
  expect(screen.getByLabelText('Ver más (5) · Traducción').props.accessibilityState).toEqual({ expanded: false });
});

it.each([
  ['es', 'Ver más (5)', 'Ver menos'], ['en', 'See more (5)', 'See less'],
  ['fr', 'Voir plus (5)', 'Voir moins'], ['pt', 'Ver mais (5)', 'Ver menos'],
])('translates expansion controls in %s', async (language, more, less) => {
  mockLanguage = language;
  await render(<AchievementsCard achievements={catalogue()} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  await fireEvent.press(screen.getAllByText(more)[0]);
  expect(screen.getByText(less)).toBeTruthy();
  await fireEvent.press(screen.getByText(less));
  expect(screen.getAllByText(more)).toHaveLength(2);
});

it('starts collapsed, preserves category expansion and closes details on collapse', async () => {
  await render(<AchievementsCard achievements={catalogue()} loading={false} error={false} reload={jest.fn()} isWide />);
  expect(screen.getByText('Logros')).toBeTruthy();
  expect(screen.getByLabelText('Expandir logros').props.accessibilityState).toEqual({ expanded: false });
  expect(screen.queryByText('Próximamente')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  await fireEvent.press(screen.getByLabelText('Ver más (5) · Traducción'));
  await fireEvent.press(screen.getByLabelText('firstSign · Próximamente'));
  expect(screen.getAllByText('Requirement: firstSign').length).toBeGreaterThan(1);
  await fireEvent.press(screen.getByLabelText('Contraer logros'));
  expect(screen.queryByText('Requirement: firstSign')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  expect(screen.getAllByText('Requirement: firstSign')).toHaveLength(1);
  expect(screen.getByLabelText('Ver menos · Traducción').props.accessibilityState).toEqual({ expanded: true });
});

it.each([
  ['es', 'Expandir logros', 'Contraer logros'], ['en', 'Expand achievements', 'Collapse achievements'],
  ['fr', 'Développer les succès', 'Réduire les succès'], ['pt', 'Expandir conquistas', 'Recolher conquistas'],
])('translates the section toggle in %s', async (language, expand, collapse) => {
  mockLanguage = language;
  await render(<AchievementsCard achievements={catalogue()} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByLabelText(expand));
  expect(screen.getByLabelText(collapse).props.accessibilityState).toEqual({ expanded: true });
  await fireEvent.press(screen.getByLabelText(collapse));
  expect(screen.getByLabelText(expand).props.accessibilityState).toEqual({ expanded: false });
});

it('queries while collapsed and does not query again when toggling the section', async () => {
  await render(<ProfileScreen />);
  expect(getMine).toHaveBeenCalled();
  const calls = getMine.mock.calls.length;
  expect(screen.getByLabelText('Expandir logros').props.accessibilityState).toEqual({ expanded: false });
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  await fireEvent.press(screen.getByLabelText('Contraer logros'));
  expect(getMine).toHaveBeenCalledTimes(calls);
});

it('shows the three server achievements without announcing unavailable functions', async () => {
  const items = [legacy(), legacy('TEN_TRANSLATIONS',10), legacy('FIFTY_TRANSLATIONS',50)];
  items[0].achievedAt = '2026-01-01T00:00:00.000Z'; items[0].currentCount = 1;
  await render(<AchievementsCard achievements={items} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  expect(screen.queryByText('Próximamente')).toBeNull();
  expect(screen.queryByText('Todavía no hay logros medibles en el catálogo nuevo.')).toBeNull();
  expect(screen.getByLabelText('FIRST_TRANSLATION · Completado')).toBeTruthy();
  expect(screen.getByLabelText('TEN_TRANSLATIONS · Pendiente')).toBeTruthy();
  expect(screen.getByLabelText('FIFTY_TRANSLATIONS · Pendiente')).toBeTruthy();
  expect(screen.getAllByRole('progressbar')).toHaveLength(4);
});
it('puts functional historical achievements ahead of catalogue groups', async () => {
  await render(<AchievementsCard achievements={[...catalogue(), legacy()]} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  const tiles = screen.getAllByRole('button').filter(p => / · (Pendiente|Próximamente)$/.test(p.props.accessibilityLabel ?? ''));
  expect(tiles[0].props.accessibilityLabel).toBe('FIRST_TRANSLATION · Pendiente');
});
it('conceals secret localizations and reveals them only after unlocking', async () => {
  const secret = legacy('SECRET',10); secret.achievement.name = '???'; secret.achievement.description = '???';
  secret.achievement.isSecret = true;
  secret.achievement.localizations = { es: { name: 'Protected secret', description: 'Protected description' } };
  const view = await render(<AchievementsCard achievements={[secret]} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  expect(screen.queryByText('Protected secret')).toBeNull();
  await view.rerender(<AchievementsCard achievements={[{ ...secret, achievedAt: '2026-01-01T00:00:00.000Z' }]} loading={false} error={false} reload={jest.fn()} isWide />);
  expect(screen.getByText('Protected secret')).toBeTruthy();
});

it('counts the three functional achievements in the profile counter', async () => {
  const first = legacy(); first.currentCount = 1; first.achievedAt = '2026-01-01T00:00:00.000Z';
  getMine.mockResolvedValue([first, legacy('TEN_TRANSLATIONS',10), legacy('FIFTY_TRANSLATIONS',50)]);
  await render(<ProfileScreen />);
  expect(await screen.findByText('1/3')).toBeTruthy();
});

it.each([Colors, DarkColors, GreenColors, GreenDarkColors])('renders all five pending grey and then completed in color in each palette', async colors => {
  mockColors = colors;
  const items = translationMilestones().map(p => ({ ...p, currentCount: p.achievement.targetCount }));
  const props = { achievements: items, loading: false, error: false, reload: jest.fn(), isWide: true };
  const view = await render(<AchievementsCard {...props} />);
  await fireEvent.press(screen.getByLabelText('Expandir logros'));
  expect(screen.queryByText('Próximamente')).toBeNull();
  for (const item of items) {
    expect(screen.getByLabelText(`${item.achievement.name} · Pendiente`)).toHaveStyle({ backgroundColor: colors.backgroundGray });
    expect(screen.getByTestId(`achievement-medal-${item.achievement.id}`)).toHaveStyle({ backgroundColor: colors.inputBg });
  }
  const tiles = screen.getAllByRole('button').filter(p => / · Pendiente$/.test(p.props.accessibilityLabel ?? ''));
  expect(tiles.map(p => p.props.accessibilityLabel)).toEqual(items.map(p => `${p.achievement.name} · Pendiente`));
  await view.rerender(<AchievementsCard {...props} achievements={items.map(p => ({ ...p, achievedAt: '2026-01-01T00:00:00.000Z' }))} />);
  for (const item of items) {
    expect(screen.getByLabelText(`${item.achievement.name} · Completado`)).toHaveStyle({ backgroundColor: colors.primaryBg, borderColor: colors.primary });
    expect(screen.getByTestId(`achievement-medal-${item.achievement.id}`)).toHaveStyle({ backgroundColor: colors.primaryBg, borderColor: colors.primary });
  }
  expect(screen.getAllByRole('progressbar')[0].props.accessibilityValue.now).toBe(100);
});

it.each([
  ['es','100 traducciones','Completa 100 traducciones.','1.000 traducciones','Completa 1.000 traducciones.'],
  ['en','100 translations','Complete 100 translations.','1,000 translations','Complete 1,000 translations.'],
  ['fr','100 traductions','Effectue 100 traductions.','1 000 traductions','Effectue 1 000 traductions.'],
  ['pt','100 traduções','Conclua 100 traduções.','1.000 traduções','Conclua 1.000 traduções.'],
])('shows completed-translation conditions in %s using server localizations', async (language,hundred,hundredDescription,thousand,thousandDescription) => {
  mockLanguage = language;
  await render(<AchievementsCard achievements={translationMilestones()} loading={false} error={false} reload={jest.fn()} isWide />);
  await fireEvent.press(screen.getByRole('button', { name: /Expandir logros|Expand achievements|Développer les succès|Expandir conquistas/ }));
  expect(screen.getByText(hundred)).toBeTruthy();
  expect(screen.getByText(thousand)).toBeTruthy();
  const hundredTile = screen.getAllByRole('button').find(p => p.props.accessibilityLabel?.startsWith(`${hundred} ·`));
  await fireEvent.press(hundredTile!);
  expect(screen.getByText(hundredDescription)).toBeTruthy();
  const closeText: Record<string,string> = { es: 'Cerrar', en: 'Close', fr: 'Fermer', pt: 'Fechar' };
  await fireEvent.press(screen.getByText(closeText[language]));
  const thousandTile = screen.getAllByRole('button').find(p => p.props.accessibilityLabel?.startsWith(`${thousand} ·`));
  await fireEvent.press(thousandTile!);
  expect(screen.getByText(thousandDescription)).toBeTruthy();
});

it('counts all five functional achievements in the profile counter', async () => {
  const items = translationMilestones();
  items[0].currentCount = 1; items[0].achievedAt = '2026-01-01T00:00:00.000Z';
  getMine.mockResolvedValue(items);
  await render(<ProfileScreen />);
  expect(await screen.findByText('1/5')).toBeTruthy();
});

it('renders all 21 measured rules pending in grey and completed in color without announcements',async()=>{
 const items=functionalAchievements();
 const props={achievements:items,loading:false,error:false,reload:jest.fn(),isWide:true};
 const view=await render(<AchievementsCard {...props}/>);
 await fireEvent.press(screen.getByLabelText('Expandir logros'));
 for(const button of screen.getAllByRole('button').filter(p=>/^Ver más/.test(p.props.accessibilityLabel??'')))await fireEvent.press(button);
 expect(screen.queryByText('Próximamente')).toBeNull();
 for(const item of items)expect(screen.getByLabelText(`${item.achievement.name} · Pendiente`)).toHaveStyle({backgroundColor:Colors.backgroundGray});
 await view.rerender(<AchievementsCard {...props} achievements={items.map(p=>({...p,currentCount:p.achievement.targetCount,achievedAt:'2026-10-21T12:00:00.000Z'}))}/>);
 for(const item of items)expect(screen.getByLabelText(`${item.achievement.name} · Completado`)).toHaveStyle({backgroundColor:Colors.primaryBg});
});
