

export const Spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   32,
  8:   40,
  9:   48,
  10:  56,
  11:  64,

  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
  '2xl': 72,
  '3xl': 128,
} as const;

export const FontSize = {
  xs:   10,
  sm:   13,
  base: 16,
  lg:   20,
  xl:   25,
  '2xl': 31,
  '3xl': 39,
  '4xl': 49,
  '5xl': 61,
} as const;

export const FontWeight = {
  thin:      '100' as const,
  light:     '300' as const,
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
} as const;

export const LineHeight = {
  none:    1,
  tight:   1.25,
  snug:    1.375,
  normal:  1.5,
  relaxed: 1.625,
  loose:   2,
} as const;

export const LetterSpacing = {
  tighter: -0.8,
  tight:   -0.4,
  normal:  0,
  wide:    0.4,
  wider:   0.8,
  widest:  1.6,
} as const;

export const TextStyles = {
  h1: { fontSize: 48, fontWeight: FontWeight.bold,      lineHeight: 58,  letterSpacing: -0.96 },
  h2: { fontSize: 36, fontWeight: FontWeight.bold,      lineHeight: 47,  letterSpacing: -0.36 },
  h3: { fontSize: 28, fontWeight: FontWeight.semibold,  lineHeight: 39,  letterSpacing: 0 },
  h4: { fontSize: 24, fontWeight: FontWeight.semibold,  lineHeight: 34,  letterSpacing: 0 },
  h5: { fontSize: 20, fontWeight: FontWeight.semibold,  lineHeight: 30,  letterSpacing: 0 },
  h6: { fontSize: 16, fontWeight: FontWeight.semibold,  lineHeight: 24,  letterSpacing: 0.16 },
  body:    { fontSize: 16, fontWeight: FontWeight.normal, lineHeight: 24, letterSpacing: 0 },
  small:   { fontSize: 14, fontWeight: FontWeight.normal, lineHeight: 21, letterSpacing: 0 },
  caption: { fontSize: 12, fontWeight: FontWeight.normal, lineHeight: 18, letterSpacing: 0.12 },
  label:   { fontSize: 12, fontWeight: FontWeight.semibold, lineHeight: 16, letterSpacing: 0.6 },
} as const;

export const BorderRadius = {
  none:    0,
  sm:      4,
  DEFAULT: 8,
  md:      12,
  lg:      16,
  xl:      24,
  full:    9999,
} as const;

export const BorderWidth = {
  none:   0,
  thin:   1,
  medium: 1.5,
  thick:  2,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
  },

  primary: {
    shadowColor: '#9B77E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryLg: {
    shadowColor: '#9B77E6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
} as const;

export const ZIndex = {
  hide:         -1,
  base:          0,
  dropdown:   1000,
  sticky:     1020,
  overlay:    1030,
  modal:      1040,
  popover:    1050,
  tooltip:    1060,
  notification: 1070,
} as const;

export const ComponentSizes = {
  button: {
    sm: { height: 36, paddingHorizontal: 14 },
    md: { height: 48, paddingHorizontal: 20 },
    lg: { height: 56, paddingHorizontal: 28 },
  },
  input: {
    sm: { height: 36, paddingHorizontal: 12 },
    md: { height: 48, paddingHorizontal: 14 },
    lg: { height: 56, paddingHorizontal: 16 },
  },
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  avatar: {
    sm: 32,
    md: 48,
    lg: 72,
    xl: 90,
  },
} as const;

export const Animation = {
  duration: {
    instant: 0,
    fast:    150,
    DEFAULT: 250,
    slow:    350,
    slower:  500,
  },
} as const;
