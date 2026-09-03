
import { Alert } from 'react-native';

type DialogIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

interface AlertOptions {
  title?: string;
  message?: string;

  icon?: DialogIcon;
}

interface ConfirmOptions extends AlertOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface ChoiceOption {
  key: string;
  label: string;
  destructive?: boolean;
}

interface ChoiceDialogOptions extends AlertOptions {
  choices: ChoiceOption[];
  cancelText?: string;
}

export const showAlert = (opts: AlertOptions): Promise<void> =>
  new Promise(resolve => {
    Alert.alert(opts.title || '', opts.message || '', [
      { text: 'OK', onPress: () => resolve() },
    ]);
  });

export const showSuccess = (message: string, title = ''): Promise<void> =>
  showAlert({ title, message });

export const showError = (message: string, title = ''): Promise<void> =>
  showAlert({ title, message });

export const showInfo = (message: string, title = ''): Promise<void> =>
  showAlert({ title, message });

export const showConfirm = (opts: ConfirmOptions): Promise<boolean> =>
  new Promise(resolve => {
    Alert.alert(opts.title || '', opts.message || '', [
      { text: opts.cancelText || 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      {
        text: opts.confirmText || 'OK',
        style: opts.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });

export const showChoice = (opts: ChoiceDialogOptions): Promise<string | null> =>
  new Promise(resolve => {
    const buttons = [
      { text: opts.cancelText || 'Cancelar', style: 'cancel' as const, onPress: () => resolve(null) },
      ...opts.choices.map(c => ({
        text: c.label,
        style: c.destructive ? ('destructive' as const) : ('default' as const),
        onPress: () => resolve(c.key),
      })),
    ];
    Alert.alert(opts.title || '', opts.message || '', buttons);
  });

export const dialogsSupported = (): boolean => true;
