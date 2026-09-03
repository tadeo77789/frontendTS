/**
 * Paleta del diseño público "TraduceSeña Landing" (claude.ai/design).
 * Se conservan los hex exactos del handoff para que las páginas públicas
 * (Landing, Traductor demo, Alfabeto demo, Nosotros) queden idénticas al
 * diseño entregado. La app interna sigue usando `Colors` (colors.ts).
 */
export const LandingTheme = {
  ink:        '#1F2937',
  body:       '#6B7280',
  bodyLight:  '#4B5563',
  bodyDeep:   '#5B5470',
  hint:       '#9CA3AF',
  hintSoft:   '#B4AEC2',
  purple:     '#9B77E6',
  purpleDark: '#7E5AD0',
  purpleBtn:  '#BE9EF4',
  purpleBtn2: '#D4C2F3',
  violet:     '#8B5CF6',
  lilacBg:    '#EDE9FE',
  lilacSoft:  '#EFEBFD',
  lilacLine:  '#F1EEF9',
  lilacBorder:'#EEE9FA',
  cardBg:     '#FBFAFE',
  cardBorder: '#F1EEF9',
  footerBg:   '#F8F6FD',
  divider:    '#EAE4F7',
  border:     '#C4B5FD',
  borderSoft: '#D6C9F5',
  accentLine: '#C4B5FD',
  green:      '#10B981',
  greenBg:    '#DCF5EA',
  amber:      '#F59E0B',
  amberBg:    '#FCF3D6',
  white:      '#FFFFFF',
} as const;

export type PublicSection = 'inicio' | 'traductor' | 'alfabeto' | 'nosotros';
