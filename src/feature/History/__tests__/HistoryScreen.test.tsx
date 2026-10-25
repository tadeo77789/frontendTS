import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Colors } from '../../../shared/constants/colors';
import { HistoryScreen } from '../pages/HistoryScreen';
import { translationsService } from '../../Translation/services/translations.service';

// El primer render de la pantalla supera los 5 s por defecto en CI con cobertura.
jest.setTimeout(30000);

const mockColors = Colors;
jest.mock('../../../app/providers/ThemeContext', () => ({ useColors: () => mockColors, useTheme: () => ({ isDark: false }) }));
jest.mock('../../../app/config/i18n', () => {
  const es: Record<string, string> = require('../../../app/config/i18n/locales/es').default;
  return { useTranslation: () => ({ language: 'es', t: (key: string) => es[key] ?? key }) };
});
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../../shared/components/common/AppHeader', () => ({ AppHeader: () => null }));
jest.mock('../../../shared/hooks/useTrackSectionView', () => ({ useTrackSectionView: jest.fn() }));
jest.mock('../../../shared/utils/dialogs', () => ({ showAlert: jest.fn(), showConfirm: jest.fn() }));
jest.mock('../../Translation/services/translations.service', () => ({ translationsService: { list: jest.fn(), remove: jest.fn() } }));
const list = translationsService.list as jest.Mock;

const row = { translationId: 7, inputText: 'Hola', outputText: 'Hola', type: 'sena_texto',
  createdAt: '2026-10-20T15:00:00.000Z', isDeleted: false };

beforeEach(() => jest.clearAllMocks());

it('shows an error with retry instead of an empty history when loading fails', async () => {
  list.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce([row]);
  await render(<HistoryScreen />);

  expect(await screen.findByText('No se pudo cargar el historial. Revisa tu conexión.')).toBeTruthy();
  expect(screen.queryByText('Sin traducciones')).toBeNull();

  await fireEvent.press(screen.getByText('Reintentar'));
  expect(await screen.findByText('Hola')).toBeTruthy();
  expect(list).toHaveBeenCalledTimes(2);
  expect(screen.queryByText('No se pudo cargar el historial. Revisa tu conexión.')).toBeNull();
});

it('shows the words of one session in a single card and deletes them together', async () => {
  const { showConfirm } = jest.requireMock('../../../shared/utils/dialogs');
  showConfirm.mockResolvedValueOnce(true);
  (translationsService.remove as jest.Mock).mockResolvedValue(undefined);
  list.mockResolvedValueOnce([
    { ...row, translationId: 9, inputText: 'COMO', outputText: 'COMO', confidence: '0.850', createdAt: '2026-10-20T15:01:00.000Z' },
    { ...row, translationId: 8, inputText: 'HOLA', outputText: 'HOLA', confidence: '0.920', createdAt: '2026-10-20T15:00:00.000Z' },
  ]);
  await render(<HistoryScreen />);

  expect(await screen.findByText('HOLA COMO')).toBeTruthy();
  await fireEvent.press(screen.getByText('Ver palabras'));
  expect(screen.getByText('92%')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Eliminar'));
  expect(await screen.findByText('Sin traducciones')).toBeTruthy();
  expect(translationsService.remove).toHaveBeenCalledWith(9);
  expect(translationsService.remove).toHaveBeenCalledWith(8);
});

it('keeps the empty state for a history that loaded with no rows', async () => {
  list.mockResolvedValueOnce([]);
  await render(<HistoryScreen />);

  expect(await screen.findByText('Sin traducciones')).toBeTruthy();
  expect(screen.queryByText('Reintentar')).toBeNull();
});
