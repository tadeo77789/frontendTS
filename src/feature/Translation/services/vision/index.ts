
import { mediapipeProvider } from './mediapipeProvider';
import { templateStore } from './templateStore';
import { gestureStore } from './motionTemplateStore';
import {
  snapshotGestureSequence,
  clearMotionBuffer,
  setGestureCaptureMode,
} from './motionClassifier';

// Diagnostico: que plantilla quedo mas cerca en la ultima comparacion.
export { getLastWordMatch } from './motionClassifier';
export type { WordMatchDebug } from './motionClassifier';
import type { SignVisionProvider } from './types';

export const signVisionProvider: SignVisionProvider = mediapipeProvider;

/**
 * true cuando el proveedor activo es el simulador (móvil sin modelo): inventa
 * letras y palabras, así que no se debe mostrar ni guardar como traducción real.
 */
export const isSimulatedRecognition: boolean = signVisionProvider.name.includes('mock');

export const recordSample = async (
  label: string,
  features: number[] | Float32Array,
): Promise<void> => {
  const arr = features instanceof Float32Array ? features : Float32Array.from(features);
  await templateStore.add(label, arr);
};

export const getSampleCounts = (): Promise<Record<string, number>> =>
  templateStore.countByLabel();

export const clearTrainingData = (): Promise<void> => templateStore.clear();

export const clearLabel = (label: string): Promise<void> =>
  templateStore.removeLabel(label);

export const exportTrainingJson = (): Promise<string> => templateStore.exportJSON();

export const importTrainingJson = (
  json: string,
  mode: 'merge' | 'replace' = 'merge',
): Promise<number> => templateStore.importJSON(json, mode);

export const beginGestureCapture = (): void => {
  clearMotionBuffer();
  setGestureCaptureMode(true);
};

export const recordGesture = async (label: string): Promise<boolean> => {
  try {
    const seq = snapshotGestureSequence();
    if (!seq) return false;
    await gestureStore.add(label, seq);
    clearMotionBuffer();
    return true;
  } finally {
    setGestureCaptureMode(false);
  }
};

export const getGestureCounts = (): Promise<Record<string, number>> =>
  gestureStore.countByLabel();

export const clearGestureLabel = (label: string): Promise<void> =>
  gestureStore.removeLabel(label);

export const clearGestureData = (): Promise<void> => gestureStore.clear();

export const exportGesturesJson = (): Promise<string> => gestureStore.exportJSON();
export const importGesturesJson = (
  json: string,
  mode: 'merge' | 'replace' = 'merge',
): Promise<number> => gestureStore.importJSON(json, mode);

export { mockProvider } from './mockProvider';
export { mediapipeProvider } from './mediapipeProvider';
export type { SignVisionProvider, VisionFrame, SignDetectionResult } from './types';

// Modo "palabras": usa el modelo propio de LSC si esta servido, y si no el
// GestureRecognizer pre-entrenado de Google (7 senas).
export { gestureEngine, wordVocabulary, isGenericGestureEngine, activeEngineName, wordEnginePerf, wordPrediction, wordState, setSampleSink } from './wordEngine';
export type { GestureEngine, GestureRecognition } from './gestureProvider';
export {
  GESTURE_DICTIONARY,
  GESTURE_CATEGORIES,
  lookupGestureWord,
  lookupGestureHint,
} from './gestureDictionary';
export type { GestureEntry } from './gestureDictionary';

// Muestras propias para reajustar el modelo (pantalla de entrenamiento).
export {
  guardarMuestra,
  contarPorGlosa,
  borrarGlosa as borrarMuestrasDe,
  borrarTodo as borrarTodasLasMuestras,
  descargar as descargarMuestras,
} from './sampleStore';
