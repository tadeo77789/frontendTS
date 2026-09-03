import { useCallback, useMemo, useState } from 'react';

/**
 * Estado de hover para web. En movil los eventos onHoverIn/onHoverOut nunca se
 * disparan, asi que `hovered` se queda en false y los estilos de hover no aplican.
 *
 * Solo funciona sobre componentes que acepten esos props (Pressable de RN Web).
 */
export const useHover = () => {
  const [hovered, setHovered] = useState(false);

  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);

  const hoverProps = useMemo(() => ({ onHoverIn, onHoverOut }), [onHoverIn, onHoverOut]);

  return { hovered, hoverProps };
};
