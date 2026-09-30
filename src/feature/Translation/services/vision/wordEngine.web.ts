/**
 * Elige con que motor se reconocen las palabras.
 *
 * Si hay un modelo propio servido en /models/lsc/, se usa ese. Si no, se cae
 * al GestureRecognizer de 7 gestos de Google, que fue el relleno de la demo.
 *
 * La decision se toma una sola vez, al arrancar la camara, y queda anotada en
 * `activeEngineName` para poder mostrarla.
 */

import { gestureEngine as legacyEngine } from './gestureProvider';
import type { GestureEngine, GestureRecognition } from './gestureProvider';
import { GESTURE_CATEGORIES, GESTURE_DICTIONARY } from './gestureDictionary';
import { enginePerf, getLastPrediction, isModelAvailable, modelWordEngine } from './modelWordEngine.web';
import type { EnginePerf, Prediction } from './wordEngineTypes';

let active: GestureEngine | null = null;

export const activeEngineName = (): string => active?.name ?? 'sin iniciar';

/** Palabras que el motor activo puede reconocer, para mostrarlas en pantalla. */
export const wordVocabulary = (): { word: string; hint: string }[] => {
  if (active === modelWordEngine) {
    return modelWordEngine.vocabulary().map(word => ({ word, hint: '' }));
  }
  return GESTURE_CATEGORIES.map(c => ({
    word: GESTURE_DICTIONARY[c].word,
    hint: GESTURE_DICTIONARY[c].hint,
  }));
};

/**
 * Rendimiento del motor de modelo: null cuando corre el de 7 gestos, que no
 * esta instrumentado porque va a desaparecer.
 */
export const wordEnginePerf = (): EnginePerf | null =>
  active === modelWordEngine ? enginePerf() : null;

/** Ultima prediccion del modelo, para poder mostrar "no seguro". */
export const wordPrediction = (): Prediction | null =>
  active === modelWordEngine ? getLastPrediction() : null;

export const gestureEngine: GestureEngine = {
  name: 'palabras',
  isSupported: true,

  async start(onResult: (result: GestureRecognition | null) => void) {
    active = (await isModelAvailable()) ? modelWordEngine : legacyEngine;
    await active.start(onResult);
  },

  stop() {
    active?.stop();
  },
};
