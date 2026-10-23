
import BaseSwal, { type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2';

// heightAuto: false evita que SweetAlert fuerce height:auto en <html>/<body>,
// lo que colapsa el layout de React Native Web y deja el fondo en blanco.
const BaseMixin = BaseSwal.mixin({ heightAuto: false, customClass: { popup: 'ts-swal' } });

const NEUTRAL = '#9CA3AF';

// Misma pila de fuentes que React Native Web usa en <Text>; sin esto SweetAlert
// hereda la serif por defecto del <body>.
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export interface DialogPalette {
  background: string;
  title: string;
  text: string;
  primary: string;
  danger: string;
}

let palette: DialogPalette = {
  background: '#FFFFFF',
  title: '#7C5BD0',
  text: '#374151',
  primary: '#9B77E6',
  danger: '#DC2626',
};

const STYLE_ID = 'ts-swal-style';

const renderStyle = (): void => {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `
.ts-swal, .ts-swal button { font-family: ${FONT_STACK}; }
.ts-swal { border-radius: 16px; }
.ts-swal .swal2-title { color: ${palette.title}; font-size: 22px; font-weight: 700; }
.ts-swal .swal2-html-container { color: ${palette.text}; font-size: 16px; line-height: 1.5; }
.ts-swal .swal2-styled { border-radius: 10px; font-weight: 600; }
`;
};

// ThemeProvider la llama al cambiar modo (claro/oscuro) o acento (morado/verde).
export const setDialogPalette = (next: DialogPalette): void => {
  palette = next;
  renderStyle();
};

const Swal = {
  fire: (opts: SweetAlertOptions) => {
    renderStyle();
    return BaseMixin.fire({ background: palette.background, color: palette.text, ...opts });
  },
  getPopup: () => BaseSwal.getPopup(),
  close: () => BaseSwal.close(),
};

interface AlertOptions {
  title?: string;
  message?: string;
  icon?: SweetAlertIcon;
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

export const showAlert = async (opts: AlertOptions): Promise<void> => {
  await Swal.fire({
    title: opts.title || '',
    text: opts.message || '',
    icon: opts.icon,
    confirmButtonColor: palette.primary,
  });
};

export const showSuccess = (message: string, title = ''): Promise<void> =>
  showAlert({ title, message, icon: 'success' });

export const showError = (message: string, title = ''): Promise<void> =>
  showAlert({ title, message, icon: 'error' });

export const showInfo = (message: string, title = ''): Promise<void> =>
  showAlert({ title, message, icon: 'info' });

export const showConfirm = async (opts: ConfirmOptions): Promise<boolean> => {
  const res = await Swal.fire({
    title: opts.title || '',
    text: opts.message || '',
    icon: opts.icon ?? (opts.destructive ? 'warning' : 'question'),
    showCancelButton: true,
    confirmButtonText: opts.confirmText || 'OK',
    cancelButtonText: opts.cancelText || 'Cancelar',
    confirmButtonColor: opts.destructive ? palette.danger : palette.primary,
    cancelButtonColor: NEUTRAL,
    reverseButtons: true,
    focusCancel: opts.destructive,
  });
  return res.isConfirmed;
};

export const showChoice = async (opts: ChoiceDialogOptions): Promise<string | null> => {
  if (opts.choices.length === 0) return null;

  if (opts.choices.length <= 2) {
    const [first, second] = opts.choices;
    const res = await Swal.fire({
      title: opts.title || '',
      text: opts.message || '',
      icon: opts.icon ?? 'question',
      showCancelButton: true,
      showDenyButton: !!second,
      confirmButtonText: first.label,
      denyButtonText: second?.label,
      cancelButtonText: opts.cancelText || 'Cancelar',
      confirmButtonColor: first.destructive ? palette.danger : palette.primary,
      denyButtonColor: second?.destructive ? palette.danger : palette.primary,
      cancelButtonColor: NEUTRAL,
      reverseButtons: true,
    });
    if (res.isConfirmed) return first.key;
    if (res.isDenied && second) return second.key;
    return null;
  }

  const buttonsHtml = opts.choices
    .map((c, i) => {
      const bg = c.destructive ? palette.danger : palette.primary;
      return `<button data-key="${c.key}" data-idx="${i}" style="background:${bg};color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;margin:4px;">${c.label}</button>`;
    })
    .join('');

  return new Promise<string | null>(resolve => {
    void Swal.fire({
      title: opts.title || '',
      text: opts.message || '',
      icon: opts.icon ?? 'question',
      html: `<div style="display:flex;flex-direction:column;gap:6px;align-items:center;margin-top:10px;">${buttonsHtml}</div>`,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: opts.cancelText || 'Cancelar',
      cancelButtonColor: NEUTRAL,
      didOpen: () => {
        const popup = Swal.getPopup();
        popup?.querySelectorAll<HTMLButtonElement>('button[data-key]').forEach(btn => {
          btn.addEventListener('click', () => {
            Swal.close();
            resolve(btn.dataset.key ?? null);
          });
        });
      },
    }).then(res => {
      if (res.dismiss) resolve(null);
    });
  });
};

export const dialogsSupported = (): boolean => true;
