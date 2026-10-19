import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { LanguageDropdown } from '../common/LanguageDropdown';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));

const COLORS = {
  surface: '#fff', buttonBg: '#fff', border: '#ccc', text: '#000', hint: '#999', primary: '#90f', primaryBg: '#eef',
};

const renderDropdown = async (props: Partial<React.ComponentProps<typeof LanguageDropdown>> = {}) => {
  const onSelect = jest.fn();
  await render(
    <LanguageDropdown language="es" onSelect={onSelect} colors={COLORS} accessibilityLabel="Idioma" {...props} />,
  );
  return { onSelect };
};

describe('LanguageDropdown', () => {
  it('abre el menú con las cuatro opciones', async () => {
    await renderDropdown();
    expect(screen.queryByText('English')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Idioma'));

    for (const name of ['English', 'Français', 'Português']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('se cierra al tocar fuera del menú sin cambiar el idioma', async () => {
    const { onSelect } = await renderDropdown();
    await fireEvent.press(screen.getByLabelText('Idioma'));

    await fireEvent.press(screen.getByTestId('language-dropdown-backdrop'));

    expect(screen.queryByText('English')).toBeNull();
    expect(screen.queryByTestId('language-dropdown-backdrop')).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('elige un idioma y se cierra', async () => {
    const { onSelect } = await renderDropdown();
    await fireEvent.press(screen.getByLabelText('Idioma'));

    await fireEvent.press(screen.getByText('English'));

    expect(onSelect).toHaveBeenCalledWith('en');
    expect(screen.queryByText('Français')).toBeNull();
  });

  it('no abre el menú mientras está deshabilitado', async () => {
    await renderDropdown({ disabled: true });

    await fireEvent.press(screen.getByLabelText('Idioma'));

    expect(screen.queryByText('English')).toBeNull();
  });
});
