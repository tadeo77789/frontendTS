/**
 * Tipos compartidos por las dos versiones del motor de palabras (web y
 * nativa). Van aparte porque TypeScript resuelve `wordEngine.ts` al comprobar
 * tipos, y las dos firmas tienen que coincidir.
 */

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
