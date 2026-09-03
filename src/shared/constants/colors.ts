

export const PrimaryScale = {
  50:  '#F4F1FC',
  100: '#EDE9FE',
  200: '#C4B5FD',
  300: '#B49AEE',
  400: '#AD8AEF',
  500: '#9B77E6',
  600: '#7E5AD0',
  700: '#6D28D9',
  800: '#4C2A85',
  900: '#2E1A54',
  DEFAULT: '#9B77E6',
} as const;

export const NeutralScale = {
  50:  '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
  DEFAULT: '#6B7280',
} as const;

export const Colors = {

  primary:        PrimaryScale.DEFAULT,
  primaryDark:    PrimaryScale[600],
  primaryLight:   PrimaryScale[400],
  primaryLighter: PrimaryScale[200],
  primaryBg:      '#EDE9FE',
  primaryHeader:  '#FFFFFF',

  gradientPrimary: ['#BE9EF4', '#D4C2F3'] as [string, string],
  gradientPrimaryDeep: ['#C9AEF6', '#BE9EF4', '#AD8AEF'] as [string, string, string],

  background:     '#FFFFFF',
  backgroundGray: '#FBFAFE',
  surface:        '#FFFFFF',
  inputBg:        NeutralScale[100],

  textPrimary:    NeutralScale[800],
  textSecondary:  NeutralScale[500],
  textHint:       NeutralScale[400],
  textOnPrimary:  '#FFFFFF',
  textLink:       PrimaryScale.DEFAULT,

  success:  '#10B981',
  error:    '#EF4444',
  warning:  '#F59E0B',
  info:     '#3B82F6',
  danger:   '#EF4444',

  toggleOn:  PrimaryScale.DEFAULT,
  toggleOff: NeutralScale[300],

  border:      '#EEE9FA',
  borderInput: '#E3DBF7',

  modeActive:   PrimaryScale.DEFAULT,
  modeInactive: '#FFFFFF',

  google:   '#FFFFFF',
  facebook: '#1877F2',

  shadow:  'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const DarkColors = {
  ...Colors,

  // Superficies en tres niveles bien diferenciados: pagina < tarjeta < campo.
  // Antes background y backgroundGray eran el mismo negro y las tarjetas
  // apenas se despegaban del fondo.
  background:     '#16141F',
  backgroundGray: '#121019',
  surface:        '#211E2C',
  inputBg:        '#2A2637',
  border:         '#332F43',
  // Heredaba el lila claro del tema claro (#E3DBF7): en oscuro dibujaba un
  // contorno brillante alrededor de campos y pildoras.
  borderInput:    '#3B3650',

  // En oscuro el acento debe ACLARARSE. primaryDark se usa siempre como texto
  // o icono sobre fondos oscuros, asi que es el tono mas claro de la escala.
  primary:        '#AE90F0',
  primaryDark:    '#C6ADF7',
  primaryLight:   '#8E6FDE',
  primaryLighter: '#5B4E86',
  primaryBg:      '#251F3D',
  primaryHeader:  '#251F3D',

  // El degradado heredado era lila muy claro y los botones llevan texto blanco:
  // resultaba ilegible. Este mantiene el blanco por encima de 4.5:1.
  gradientPrimary: ['#7C5AD6', '#5B3FA8'] as [string, string],
  gradientPrimaryDeep: ['#8B6BE0', '#7C5AD6', '#5B3FA8'] as [string, string, string],

  textPrimary:    '#ECEAF5',
  textSecondary:  '#A9A4C0',
  // #5E5E78 quedaba en 2.2:1 sobre la tarjeta: los textos tenues ("Paso 1 de 3",
  // subtitulos) eran casi ilegibles.
  textHint:       '#8B85A6',
  textLink:       '#AE90F0',

  // Los semanticos del tema claro se apagan sobre negro; estos son sus tonos 400.
  success: '#34D399',
  error:   '#F87171',
  warning: '#FBBF24',
  info:    '#60A5FA',
  danger:  '#F87171',

  toggleOn:  '#AE90F0',
  toggleOff: '#3B3750',

  modeActive:   '#AE90F0',
  modeInactive: '#211E2C',

  shadow:  'rgba(0,0,0,0.45)',
  overlay: 'rgba(8,6,14,0.66)',
};

export const GreenColors = {
  ...Colors,
  primary:        '#4CAF82',
  primaryDark:    '#2E8B57',
  primaryLight:   '#7DC8A0',
  primaryLighter: '#A8D8BC',
  primaryBg:      '#E8F5EE',
  primaryHeader:  '#C3E6D0',
  gradientPrimary: ['#4CAF82', '#2E8B57'] as [string, string],
  gradientPrimaryDeep: ['#5DBF8F', '#4CAF82', '#2E8B57'] as [string, string, string],
  modeActive:  '#4CAF82',
  toggleOn:    '#4CAF82',
  textLink:    '#4CAF82',
};

export const GreenDarkColors = {
  ...DarkColors,

  // Mismos tres niveles que el violeta, con la base verde ligeramente
  // desaturada: #0E140F era casi negro puro y resultaba duro.
  background:     '#111A14',
  backgroundGray: '#0E1610',
  surface:        '#1A251E',
  inputBg:        '#212E25',
  border:         '#2C3B31',
  borderInput:    '#35473A',

  primary:        '#5FC894',
  primaryDark:    '#8ADCB4',
  primaryLight:   '#4CAF82',
  primaryLighter: '#3E6B54',
  primaryBg:      '#14301F',
  primaryHeader:  '#14301F',

  // Verde algo mas profundo que en claro para que el texto blanco del boton
  // se lea bien.
  gradientPrimary: ['#2F8A60', '#1F6B47'] as [string, string],
  gradientPrimaryDeep: ['#3E9E72', '#2F8A60', '#1F6B47'] as [string, string, string],

  // Los grises del tema violeta desentonaban sobre una base verde.
  textPrimary:    '#E9F0EB',
  textSecondary:  '#A2B6A9',
  textHint:       '#87A091',
  textLink:       '#5FC894',

  toggleOn:    '#5FC894',
  toggleOff:   '#33443A',
  modeActive:  '#5FC894',
  modeInactive: '#1A251E',
};
