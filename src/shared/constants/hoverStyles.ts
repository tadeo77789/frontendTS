import { ViewStyle } from 'react-native';

/**
 * Sombra elevada compartida para el estado hover de los botones (web).
 * Se aplica junto a un pequeno desplazamiento hacia arriba / escala.
 */
export const HoverShadow: ViewStyle = {
  shadowColor: '#7C3AED',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.28,
  shadowRadius: 20,
  elevation: 10,
};

/** Sombra hover neutra, para botones sobre superficies claras sin acento morado. */
export const HoverShadowSoft: ViewStyle = {
  shadowColor: '#1E143C',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.16,
  shadowRadius: 16,
  elevation: 6,
};
