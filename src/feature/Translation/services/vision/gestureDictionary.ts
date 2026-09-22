/**
 * Diccionario de gestos -> palabras en espanol.
 *
 * Unico punto de configuracion del vocabulario reconocido por el
 * GestureRecognizer. Hoy mapea las 7 categorias del modelo pre-entrenado de
 * MediaPipe; cuando exista un modelo propio de LSC basta con cambiar las
 * claves de este archivo (y la URL del `.task` en `api.config.ts`) sin tocar
 * el provider ni la UI.
 */

export interface GestureEntry {
  /** Palabra en espanol que se muestra y se persiste como `outputText`. */
  word: string;
  /** Descripcion de la sena, usada como ayuda en pantalla. */
  hint: string;
}

/** Categoria que devuelve MediaPipe cuando no reconoce ninguna sena. */
export const NO_GESTURE_CATEGORY = 'None';

export const GESTURE_DICTIONARY: Record<string, GestureEntry> = {
  Open_Palm: { word: 'Hola', hint: 'Mano abierta, palma al frente' },
  Thumb_Up: { word: 'Bien', hint: 'Pulgar arriba' },
  Thumb_Down: { word: 'Mal', hint: 'Pulgar abajo' },
  Victory: { word: 'Paz', hint: 'Indice y medio en V' },
  ILoveYou: { word: 'Te quiero', hint: 'Pulgar, indice y menique extendidos' },
  Closed_Fist: { word: 'Si', hint: 'Puno cerrado' },
  Pointing_Up: { word: 'Atencion', hint: 'Indice apuntando arriba' },
};

/** Categorias soportadas, en el orden en que se muestran como ayuda. */
export const GESTURE_CATEGORIES = Object.keys(GESTURE_DICTIONARY);

/**
 * Traduce una categoria de MediaPipe a su palabra en espanol.
 * Devuelve `null` para `None` y para cualquier categoria fuera del diccionario,
 * de modo que el provider pueda ignorarla sin casos especiales.
 */
export const lookupGestureWord = (categoryName: string | undefined | null): string | null => {
  if (!categoryName || categoryName === NO_GESTURE_CATEGORY) return null;
  return GESTURE_DICTIONARY[categoryName]?.word ?? null;
};

export const lookupGestureHint = (categoryName: string | undefined | null): string | null => {
  if (!categoryName) return null;
  return GESTURE_DICTIONARY[categoryName]?.hint ?? null;
};
