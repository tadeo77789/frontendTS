
import { useCallback, useRef } from 'react';
import { Platform, ScrollView, type NativeSyntheticEvent, type TargetedEvent } from 'react-native';

/**
 * Desplaza el ScrollView para dejar visible el campo que acaba de recibir foco
 * cuando el teclado del movil lo tapa.
 *
 * Uso:
 *   const { scrollRef, handleInputFocus } = useScrollToInput();
 *   <ScrollView ref={scrollRef}> ... <TextInput onFocus={handleInputFocus} />
 */
export function useScrollToInput(extraOffset = 110) {
  const scrollRef = useRef<ScrollView>(null);

  const handleInputFocus = useCallback((e: NativeSyntheticEvent<TargetedEvent>) => {
    // En web el teclado no tapa el contenido: el navegador ya lo resuelve.
    if (Platform.OS === 'web') return;
    const node = (e?.nativeEvent?.target ?? (e as any)?.target) as number | undefined;
    // Esperamos a que el teclado termine de abrir para medir con la altura real.
    setTimeout(() => {
      const sv = scrollRef.current as any;
      if (!sv) return;
      if (typeof sv.scrollResponderScrollNativeHandleToKeyboard === 'function' && node != null) {
        sv.scrollResponderScrollNativeHandleToKeyboard(node, extraOffset, true);
      } else {
        sv.scrollToEnd?.({ animated: true });
      }
    }, 180);
  }, [extraOffset]);

  return { scrollRef, handleInputFocus };
}
