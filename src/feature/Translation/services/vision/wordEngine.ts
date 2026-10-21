/**
 * Version para iOS/Android: el motor de palabras corre dentro de un WebView.
 *
 * MediaPipe Tasks y el modelo LSC son librerias de navegador (WASM y <video>),
 * y React Native no las puede correr. En vez de duplicar el motor, la pantalla
 * monta `WordEngineView`, que abre la misma web en modo embebido
 * (`?embed=word-engine`): la pagina pide la camara, corre el motor web y manda
 * cada resultado por `postMessage`.
 *
 * Este archivo es el otro extremo del puente. Recibe esos mensajes y los
 * entrega con el mismo contrato que la version web, asi que `useGestureAgent`
 * y la pantalla no distinguen una de otra. Metro toma `wordEngine.web.ts`
 * cuando la plataforma es web.
 */

import type { GestureEngine, GestureRecognition } from './gestureProvider';
import type {
  EnginePerf,
  Prediction,
  WordEngineCommand,
  WordEngineMessage,
  WordEngineState,
} from './wordEngineTypes';

/**
 * La primera vez la pagina baja MediaPipe y el modelo (unos 15 MB). Con datos
 * moviles eso tarda, asi que el margen es amplio.
 */
const READY_TIMEOUT_MS = 60_000;

let onResult: ((result: GestureRecognition | null) => void) | null = null;
let pending: { resolve: () => void; reject: (err: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;
let sendCommand: ((cmd: WordEngineCommand) => void) | null = null;

// Espejo de lo que reporta la pagina, para las consultas de la pantalla.
let ready = false;
let engineName = 'sin iniciar';
let completeSigns = false;
let generic = false;
let vocabulary: { word: string; hint: string }[] = [];
let state: WordEngineState = 'quieto';
let perf: EnginePerf | null = null;
let prediction: Prediction | null = null;

const settle = (err?: Error): void => {
  if (!pending) return;
  const p = pending;
  pending = null;
  clearTimeout(p.timer);
  if (err) p.reject(err);
  else p.resolve();
};

const clearMirror = (): void => {
  ready = false;
  engineName = 'sin iniciar';
  completeSigns = false;
  generic = false;
  vocabulary = [];
  state = 'quieto';
  perf = null;
  prediction = null;
};

/**
 * La llama `WordEngineView` al montarse, con la funcion que manda ordenes a la
 * pagina. Devuelve la funcion de limpieza para el desmontaje.
 */
export const connectWordEngineView = (send: (cmd: WordEngineCommand) => void): (() => void) => {
  clearMirror();
  sendCommand = send;
  return () => {
    if (sendCommand !== send) return;
    sendCommand = null;
    clearMirror();
  };
};

/** El WebView no pudo cargar la pagina: el arranque falla con ese motivo. */
export const failWordEngine = (message: string): void => settle(new Error(message));

/** Entrada de cada `postMessage` de la pagina embebida. */
export const handleWordEngineMessage = (raw: string): void => {
  let msg: WordEngineMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  switch (msg?.type) {
    case 'ready':
      ready = true;
      engineName = msg.engine;
      completeSigns = msg.emitsCompleteSigns;
      generic = msg.generic;
      settle();
      break;
    case 'result':
      onResult?.(msg.result);
      break;
    case 'vocabulary':
      vocabulary = msg.words;
      break;
    case 'status':
      state = msg.state;
      perf = msg.perf;
      prediction = msg.prediction;
      break;
    case 'error':
      settle(new Error(msg.message));
      break;
  }
};

export const activeEngineName = (): string => engineName;
export const wordVocabulary = (): { word: string; hint: string }[] => vocabulary;
export const wordEnginePerf = (): EnginePerf | null => perf;
export const wordPrediction = (): Prediction | null => prediction;
export const wordState = (): WordEngineState => state;
export const isGenericGestureEngine = (): boolean => generic;

/** Grabar muestras para el modelo solo existe en web (pantalla de entrenamiento). */
export const setSampleSink = (_fn: ((sena: Float32Array[]) => void) | null): void => {};

export const gestureEngine: GestureEngine = {
  name: 'palabras',
  isSupported: true,

  get emitsCompleteSigns() {
    return completeSigns;
  },

  start(cb: (result: GestureRecognition | null) => void) {
    onResult = cb;
    settle(new Error('Arranque reemplazado'));
    // La pagina arranca sola al cargar: si ya aviso, no hay que esperar.
    if (ready) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => settle(new Error('El motor de palabras no respondio a tiempo')),
        READY_TIMEOUT_MS,
      );
      pending = { resolve, reject, timer };
    });
  },

  // La camara la suelta la pagina cuando la pantalla desmonta el WebView.
  stop() {
    onResult = null;
    settle(new Error('Detenido'));
  },

  reset() {
    sendCommand?.('reset');
  },
};
