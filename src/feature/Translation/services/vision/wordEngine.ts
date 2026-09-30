/**
 * Version para iOS/Android: no hay MediaPipe Tasks ni TensorFlow.js dentro de
 * Expo Go, asi que el motor de palabras se reporta como no soportado y la
 * pantalla muestra el aviso en vez de fallar. Metro toma `wordEngine.web.ts`
 * cuando la plataforma es web.
 */

import { gestureEngine as fallback } from './gestureProvider';
import type { EnginePerf, Prediction } from './wordEngineTypes';
export const gestureEngine = fallback;

export const activeEngineName = (): string => 'no soportado';
export const wordVocabulary = (): { word: string; hint: string }[] => [];
export const wordEnginePerf = (): EnginePerf | null => null;
export const wordPrediction = (): Prediction | null => null;
export const wordState = (): 'quieto' | 'senando' | 'analizando' => 'quieto';
