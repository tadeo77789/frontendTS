/**
 * Tipos compartidos por las dos versiones del motor de palabras (web y
 * nativa). Van aparte porque TypeScript resuelve `wordEngine.ts` al comprobar
 * tipos, y las dos firmas tienen que coincidir.
 */

import type { GestureRecognition } from './gestureProvider';

/** Medicion de rendimiento del motor de palabras. */
export interface EnginePerf {
  /** Cuanto tarda MediaPipe en sacar manos y pose de un frame. */
  landmarksMs: number;
  /** Cuanto tarda el modelo en clasificar la ventana. */
  inferenceMs: number;
  /** Frames por segundo que se estan logrando de verdad. */
  fps: number;
  frames: number;
}

/** Ultima prediccion del modelo, aceptada o no. */
export interface Prediction {
  word: string;
  score: number;
  accepted: boolean;
  at: number;
}

/** En que punto del reconocimiento esta el motor. */
export type WordEngineState = 'quieto' | 'senando' | 'analizando';

/**
 * Mensajes que la pagina embebida (web) le manda a la app nativa por el
 * WebView. Ver `WordEngineEmbed.web.tsx` y la version nativa de `wordEngine.ts`.
 */
export type WordEngineMessage =
  | { type: 'ready'; engine: string; emitsCompleteSigns: boolean; generic: boolean }
  | { type: 'result'; result: GestureRecognition | null }
  | { type: 'vocabulary'; words: { word: string; hint: string }[] }
  | { type: 'status'; state: WordEngineState; perf: EnginePerf | null; prediction: Prediction | null }
  | { type: 'error'; message: string };

/** Ordenes que la app nativa le manda a la pagina embebida. */
export type WordEngineCommand = 'reset';
