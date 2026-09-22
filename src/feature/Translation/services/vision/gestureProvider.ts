/**
 * Motor de reconocimiento de GESTOS-PALABRA (modo "palabras").
 *
 * Contrato comun a todas las plataformas. La implementacion real vive en
 * `gestureProvider.web.ts`; Metro resuelve ese archivo automaticamente cuando
 * la plataforma es web.
 *
 * En iOS/Android no hay binding de MediaPipe Tasks dentro de Expo Go (haria
 * falta un dev-client con modulo nativo), asi que el motor se reporta como no
 * soportado y la pantalla muestra el aviso correspondiente en vez de fallar.
 */

export interface GestureRecognition {
  /** Categoria cruda del modelo, p. ej. `Open_Palm`. Se guarda como inputText. */
  categoryName: string;
  /** Palabra en espanol resuelta contra `gestureDictionary`. */
  word: string;
  /** Confianza del modelo, entre 0 y 1. */
  score: number;
}

export interface GestureEngine {
  readonly name: string;
  /** `false` cuando la plataforma no puede correr MediaPipe Tasks. */
  readonly isSupported: boolean;
  /**
   * Arranca el bucle de reconocimiento sobre el <video> activo de la camara.
   * `onResult` recibe `null` en los frames sin sena reconocida.
   */
  start: (onResult: (result: GestureRecognition | null) => void) => Promise<void>;
  stop: () => void;
}

export const gestureEngine: GestureEngine = {
  name: 'gesture-unsupported',
  isSupported: false,
  async start() {
    throw new Error('El reconocimiento de gestos solo esta disponible en web');
  },
  stop() {},
};
