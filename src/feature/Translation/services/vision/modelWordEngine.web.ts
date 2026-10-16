/**
 * Motor de palabras con el modelo propio (web).
 *
 * Reemplaza al GestureRecognizer de 7 gestos de Google. Aquel reconocia gestos
 * genericos y los mapeaba a palabras en espanol, lo que chocaba con las senas
 * reales: "pulgar arriba" salia siempre como *Bien*, aunque la persona
 * estuviera haciendo *apoyar* o *ayudar*, que en LSC se hacen asi.
 *
 * Aqui se corren HandLandmarker y PoseLandmarker sobre el <video> de la
 * camara y se arman los mismos 128 valores por frame que uso el entrenamiento
 * (ver featureBuilder.ts).
 *
 * El motor NO clasifica una ventana fija de tiempo. Detecta donde empieza y
 * donde termina cada sena por el movimiento de las munecas, y clasifica una
 * sola vez por sena completa. La razon esta abajo, en `feed`.
 */

import type { Landmark } from './classifier';
import {
  buildFrameFeatures,
  flattenSequence,
  resampleWindow,
  SAMPLE_INTERVAL_MS,
  SEQ_LEN,
  FEATURE_DIM,
} from './featureBuilder';
import { MEDIAPIPE_VISION_CDN, WORD_MODEL_URL } from '../../../../app/config/api.config';
import type { GestureEngine, GestureRecognition } from './gestureProvider';
import type { EnginePerf, Prediction } from './wordEngineTypes';

const MODULE_URL = `${MEDIAPIPE_VISION_CDN}/vision_bundle.mjs`;
const WASM_BASE = `${MEDIAPIPE_VISION_CDN}/wasm`;

const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/**
 * Umbrales del reconocedor, en un solo sitio y ajustables en caliente.
 *
 * Estan aqui y no como constantes sueltas porque ninguno se puede fijar desde
 * el escritorio: dependen de la camara, la luz y de como sena cada persona.
 * Se calibran probando, con `lscTune` desde la consola del navegador:
 *
 *   lscTune({ startSpeed: 0.01, minConfidence: 0.5 })
 *   lscTune()            // muestra los valores actuales
 *
 * Cuando den buen resultado, los valores se traen aqui como nuevos valores
 * por defecto. Mientras tanto, estos son un punto de partida razonado, no
 * medido.
 */
export const tuning = {
  /**
   * Velocidad de muneca, en anchos de hombro por frame, que separa quieto de
   * senando. Arranca en el mismo umbral con el que se recortaron los clips
   * del dataset (IDLE_SPEED en features_common.py). Si el motor nunca detecta
   * que empezaste, hay que bajarlo.
   */
  startSpeed: 0.02,
  /** Frames de margen antes y despues del movimiento, como en el recorte. */
  marginFrames: 2,
  /**
   * Frames quietos seguidos que dan una sena por terminada (~0,5 s a 15 fps).
   * Muy corto parte en dos las senas de varios movimientos, como *buenos
   * dias*. Muy largo hace esperar de mas antes de responder.
   */
  endIdleFrames: 8,
  /** Menos que esto es un tic o un reacomodo de manos, no una sena. */
  minFrames: 10,
  /** Tope de seguridad: el clip mas largo del dataset dura 5,6 s. */
  maxFrames: 85,
  /** Confianza minima para mostrar una palabra; por debajo se calla. */
  minConfidence: 0.75,
  /**
   * Ventaja minima de la primera palabra sobre la segunda.
   *
   * La capa final reparte 100% entre las 20 palabras y nunca puede decir
   * "esto no es ninguna". Cuando el modelo queda partido entre dos candidatas
   * es que no sabe, aunque la primera pase el umbral de confianza.
   */
  minMargin: 0.25,
  /**
   * Fraccion de la sena que debe tener al menos una mano a la vista.
   *
   * Un frame sin manos igual es valido (los hombros se ven, las coordenadas
   * quedan en cero), y el modelo solo vio clips CON manos al entrenar: ante
   * todo ceros no se abstiene, elige la clase que mas se le parezca.
   */
  minHandRatio: 0.6,
  /**
   * Palabras que el modelo usa como respuesta por defecto y que por tanto no
   * significan nada cuando salen.
   *
   * Un clasificador con softmax no tiene forma de abstenerse: ante algo que
   * no reconoce reparte el 100% entre sus clases, y una se lleva casi todo.
   * Medido con scripts/probe-model.js, y da la misma palabra en los dos
   * modelos entrenados hasta ahora:
   *
   *                            modelo de 20      modelo de 54
   *     todo ceros             por favor 100%    por favor 73%
   *     ruido gaussiano        por favor 100%    por favor 76%
   *     200 al azar            por favor 198     por favor 182
   *
   * En el de 54 el segundo en la fila es *dies*, y con las manos quietas y
   * presentes el refugio pasa a ser *maso menos* (81%). Si alguna vez esas
   * salen por todas partes, es lo mismo con otra palabra.
   *
   * Con 100% de confianza atraviesa cualquier umbral, asi que filtrarla por
   * confianza es imposible: hay que silenciarla. Se pierde la palabra *por
   * favor*, que a cambio nunca era informativa. El arreglo de verdad es
   * reentrenar con una clase "nada"; entonces esta lista queda vacia.
   */
  suppressed: ['por favor'] as string[],
};

export type Tuning = typeof tuning;

interface MpLandmark { x: number; y: number; z: number }

interface MpDetector {
  detectForVideo(video: HTMLVideoElement, timestamp: number): {
    landmarks?: MpLandmark[][];
    worldLandmarks?: MpLandmark[][];
  };
  close(): void;
}

interface MpModule {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  HandLandmarker: { createFromOptions(vision: unknown, opts: object): Promise<MpDetector> };
  PoseLandmarker: { createFromOptions(vision: unknown, opts: object): Promise<MpDetector> };
}

// `import()` armado en runtime: literal, Metro intenta resolver la URL del CDN
// en tiempo de compilacion y falla.
const loadMpModule = (): Promise<MpModule> => {
  const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<MpModule>;
  return dynImport(MODULE_URL);
};

let hands: MpDetector | null = null;
let pose: MpDetector | null = null;
let model: { predict: (x: unknown) => unknown } | null = null;
let glosses: string[] = [];
let initPromise: Promise<void> | null = null;

/**
 * Medicion de rendimiento.
 *
 * Importa por dos razones: el plan exige que web y movil tarden lo mismo, y
 * hay que saber si los 15 fps del formato son alcanzables en el navegador de
 * un celular. Si `landmarksMs` se acerca al intervalo de muestreo (67 ms), el
 * telefono no da abasto y habria que bajar el ritmo.
 */
const perf: EnginePerf = { landmarksMs: 0, inferenceMs: 0, fps: 0, frames: 0 };
let lastSampleAt = 0;

/** Promedio movil: una sola medida salta demasiado para mostrarla. */
const smooth = (previo: number, nuevo: number): number => (previo === 0 ? nuevo : previo * 0.8 + nuevo * 0.2);

export const enginePerf = (): EnginePerf => ({ ...perf });

/**
 * Ultima prediccion, aceptada o no.
 *
 * Cuando el modelo duda se calla, y para quien esta frente a la camara eso es
 * indistinguible de "no te vi". Guardarla permite mostrar "no seguro" con la
 * palabra que estuvo cerca, que es lo que pide el plan en vez de adivinar.
 */
let lastPrediction: Prediction | null = null;

/** Ultimo vector de probabilidades, solo para el diagnostico de abajo. */
let lastProbas: Float32Array | null = null;

export const getLastPrediction = (maxAgeMs = 2000): Prediction | null =>
  lastPrediction && Date.now() - lastPrediction.at <= maxAgeMs ? lastPrediction : null;

/** Solo se avisa una vez: el bucle corre 15 veces por segundo. */
let mismatchAvisado = false;

let timer: ReturnType<typeof setInterval> | null = null;
let lastVideoTime = -1;
let busy = false;

// ------------------------------------------------------------ segmentacion

/** Frame anterior, para medir cuanto se movieron las munecas. */
let previo: Float32Array | null = null;
/** Cola corta de frames quietos, para el margen antes del movimiento. */
let preRoll: Float32Array[] = [];
/** Frames de la sena en curso. */
let segment: Float32Array[] = [];
/** Frames quietos seguidos dentro de la sena en curso. */
let idleRun = 0;
let capturing = false;

/**
 * En que punto del reconocimiento estamos, para poder decirlo en pantalla.
 * 'analizando' dura lo que tarde la inferencia (unos milisegundos), pero
 * evita que la app parezca colgada justo al terminar la sena.
 */
export type EngineState = 'quieto' | 'senando' | 'analizando';
let state: EngineState = 'quieto';
export const engineState = (): EngineState => state;

/**
 * Bitacora del motor en la consola del navegador.
 *
 * Cada sena que se cierra deja una linea diciendo cuanto duro, que salio y,
 * si no se mostro, por que. Sin esto, "no sale nada" es indistinguible de
 * "no detecta el movimiento", "la sena sale muy corta" o "el modelo duda", y
 * son problemas con arreglos distintos.
 */
const traza = (mensaje: string): void => {
  if (__DEV__) console.log(`[lsc] ${mensaje}`);
};

/** Cuanto se movio la muneca que mas se movio, entre dos frames. */
const wristSpeed = (a: Float32Array, b: Float32Array): number => {
  const derecha = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const izquierda = Math.hypot(b[63] - a[63], b[64] - a[64]);
  return Math.max(derecha, izquierda);
};

const resetSegment = (): void => {
  previo = null;
  preRoll = [];
  segment = [];
  idleRun = 0;
  capturing = false;
  state = 'quieto';
};

/**
 * Acumula frames y devuelve la sena cuando termina; null mientras tanto.
 *
 * Antes se clasificaba una ventana fija de 2 s en cada frame, y eso estaba
 * mal por dos motivos. Uno, que el modelo aprendio senas recortadas al tramo
 * con movimiento y remuestreadas a 30 frames FUERA CUAL FUERA su duracion:
 * una sena de 1,5 s y una de 4 s llegan las dos como 30 frames, asi que lo
 * que aprendio es la forma del movimiento, no su ritmo. Mostrarle 2 segundos
 * sueltos de una sena de 4 s no es mostrarle la sena. Dos, que al clasificar
 * sin parar, cada recorte a medio hacer salia como alguna de las 20 palabras,
 * que es lo que llenaba la pantalla de palabras sueltas mientras se senaba.
 */
const feed = (frame: Float32Array): Float32Array[] | null => {
  const velocidad = previo ? wristSpeed(previo, frame) : 0;
  previo = frame;

  if (!capturing) {
    preRoll.push(frame);
    if (preRoll.length > tuning.marginFrames + 1) preRoll.shift();
    if (velocidad > tuning.startSpeed) {
      // La sena arranca unos frames antes del primer movimiento detectado,
      // igual que el recorte del dataset.
      capturing = true;
      state = 'senando';
      segment = [...preRoll];
      idleRun = 0;
      traza('empieza una sena');
    }
    return null;
  }

  segment.push(frame);
  idleRun = velocidad > tuning.startSpeed ? 0 : idleRun + 1;

  if (idleRun < tuning.endIdleFrames && segment.length < tuning.maxFrames) return null;

  // Se recorta la cola quieta al margen acordado; lo que sobra no es sena.
  const sobra = Math.max(0, idleRun - tuning.marginFrames);
  const sena = segment.slice(0, segment.length - sobra);
  resetSegment();

  if (sena.length < tuning.minFrames) {
    traza(`tramo de ${sena.length} frames descartado: menos de ${tuning.minFrames}`);
    return null;
  }
  return sena;
};

/** True mientras hay una sena en curso, para avisarlo en pantalla. */
export const isCapturing = (): boolean => capturing;

/**
 * Modo grabacion: en vez de clasificar, entrega la sena para guardarla.
 *
 * Lo usa la pantalla de entrenamiento. Pasa por el mismo segmentador y el
 * mismo remuestreo que la clasificacion, asi que lo que se graba es byte por
 * byte lo que el modelo vera despues. Si se grabara por otro camino, el
 * reajuste enseñaria algo que en vivo no ocurre.
 */
let sampleSink: ((sena: Float32Array[]) => void) | null = null;

export const setSampleSink = (fn: ((sena: Float32Array[]) => void) | null): void => {
  sampleSink = fn;
};

// ------------------------------------------------------------ modelo

/**
 * Carga el modelo aceptando los dos formatos de TensorFlow.js.
 *
 * El conversor produce un "graph model" cuando se parte de un SavedModel, que
 * es el camino que funciona con Keras 3, y un "layers model" cuando se parte
 * de un .keras. Se prueba primero el de grafo, que ademas corre mas rapido.
 */
const loadModel = async (tf: unknown): Promise<{ predict: (x: unknown) => unknown }> => {
  const api = tf as {
    loadGraphModel: (u: string) => Promise<{ predict: (x: unknown) => unknown }>;
    loadLayersModel: (u: string) => Promise<{ predict: (x: unknown) => unknown }>;
  };
  try {
    return await api.loadGraphModel(WORD_MODEL_URL);
  } catch {
    return api.loadLayersModel(WORD_MODEL_URL);
  }
};

/** tfjs se carga aparte: pesa y solo hace falta si existe un modelo propio. */
const loadTf = async () => (await import('@tensorflow/tfjs')).default ?? (await import('@tensorflow/tfjs'));

const init = async (): Promise<void> => {
  const tf = await loadTf();
  const mp = await loadMpModule();
  const vision = await mp.FilesetResolver.forVisionTasks(WASM_BASE);

  [hands, pose] = await Promise.all([
    mp.HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
    }),
    mp.PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    }),
  ]);

  // El modelo y sus glosas se sirven juntos desde /models/lsc/.
  const [cargado, listaGlosas] = await Promise.all([
    loadModel(tf),
    fetch(WORD_MODEL_URL.replace(/model\.json$/, 'glosas.json')).then(r => r.json() as Promise<string[]>),
  ]);
  model = cargado;
  glosses = listaGlosas;
};

const ensureReady = (): Promise<void> => {
  if (!initPromise) {
    initPromise = init().catch(err => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
};

/** El <video> de expo-camera es el unico reproduciendo con dimensiones reales. */
const findActiveVideo = (): HTMLVideoElement | null =>
  Array.from(document.querySelectorAll('video')).find(
    v => v.readyState >= 2 && v.videoWidth > 0 && !v.paused,
  ) ?? null;

/** Devuelve los 128 valores de este frame, o null si no hubo frame util. */
const sampleFrame = (): Float32Array | null => {
  if (busy || !hands || !pose) return null;
  const video = findActiveVideo();
  if (!video) return null;

  // detectForVideo exige marcas de tiempo crecientes: si el frame no avanzo,
  // se omite en vez de reprocesar el mismo instante.
  if (video.currentTime === lastVideoTime) return null;
  lastVideoTime = video.currentTime;

  busy = true;
  try {
    const now = performance.now();
    const handRes = hands.detectForVideo(video, now);
    const poseRes = pose.detectForVideo(video, now);
    perf.landmarksMs = smooth(perf.landmarksMs, performance.now() - now);
    if (lastSampleAt) perf.fps = smooth(perf.fps, 1000 / Math.max(1, now - lastSampleAt));
    lastSampleAt = now;
    perf.frames++;

    // Sin hombros no hay marco de referencia: ese frame no sirve.
    return buildFrameFeatures({
      hands: (handRes.landmarks ?? []) as Landmark[][],
      pose: (poseRes.landmarks?.[0] ?? null) as Landmark[] | null,
    });
  } catch {
    // Un frame fallido no debe cortar el bucle.
    return null;
  } finally {
    busy = false;
  }
};

/** Clasifica una sena ya delimitada. Se llama una vez por sena, no por frame. */
const classify = async (sena: Float32Array[]): Promise<GestureRecognition | null> => {
  if (!model) return null;
  state = 'analizando';

  const duracion = ((sena.length / 15)).toFixed(1);
  let conMano = 0;
  for (const frame of sena) if (frame[126] > 0.5 || frame[127] > 0.5) conMano++;
  const ratio = conMano / sena.length;
  if (ratio < tuning.minHandRatio) {
    traza(`sena de ${sena.length} frames (~${duracion}s) descartada: manos visibles solo el ${(ratio * 100).toFixed(0)}%`);
    return null;
  }

  // Toda la sena a 30 frames, dure lo que dure: es como se entreno.
  const sequence = resampleWindow(sena);
  if (!sequence) return null;

  const tf = await loadTf();
  const tensor = (tf as { tensor: (d: Float32Array, s: number[]) => unknown }).tensor(
    flattenSequence(sequence),
    [1, SEQ_LEN, FEATURE_DIM],
  );

  const inicio = performance.now();
  try {
    const salida = model.predict(tensor) as { data: () => Promise<Float32Array>; dispose: () => void };
    const probas = await salida.data();
    salida.dispose();
    lastProbas = probas;
    perf.inferenceMs = smooth(perf.inferenceMs, performance.now() - inicio);

    // Si el modelo y la lista de palabras no vienen del mismo entrenamiento,
    // cada salida queda con el nombre de otra sena y la app se equivoca sin
    // dar ningun sintoma. Se avisa una vez y se calla, que es preferible a
    // traducir mal con toda confianza.
    if (probas.length !== glosses.length) {
      if (!mismatchAvisado) {
        mismatchAvisado = true;
        console.error(
          `El modelo tiene ${probas.length} salidas y glosas.json trae ${glosses.length} palabras. ` +
            'Los dos archivos de /models/lsc/ tienen que salir de la misma exportacion.',
        );
      }
      return null;
    }

    let mejor = 0;
    for (let i = 1; i < probas.length; i++) if (probas[i] > probas[mejor]) mejor = i;
    let segunda = mejor === 0 ? 1 : 0;
    for (let i = 0; i < probas.length; i++) {
      if (i !== mejor && probas[i] > probas[segunda]) segunda = i;
    }

    const score = probas[mejor];
    const margen = score - probas[segunda];
    const word = glosses[mejor];
    const refugio = tuning.suppressed.includes(word);
    const aceptada = !refugio && score >= tuning.minConfidence && margen >= tuning.minMargin;

    lastPrediction = { word, score, accepted: aceptada, at: Date.now() };

    const motivo = refugio
      ? `"${word}" es la respuesta por defecto del modelo: no reconocio nada`
      : score < tuning.minConfidence
      ? `confianza ${(score * 100).toFixed(0)}% < ${tuning.minConfidence * 100}%`
      : margen < tuning.minMargin
        ? `le saca solo ${(margen * 100).toFixed(0)} puntos a ${glosses[segunda]}`
        : 'aceptada';
    traza(
      `sena de ${sena.length} frames (~${duracion}s) -> ${word} ${(score * 100).toFixed(0)}% ` +
        `(2a: ${glosses[segunda]} ${(probas[segunda] * 100).toFixed(0)}%) · ${motivo}`,
    );

    if (!aceptada) return null;
    return { categoryName: word, word, score };
  } finally {
    (tensor as { dispose: () => void }).dispose();
    state = 'quieto';
  }
};

export const modelWordEngine: GestureEngine & { vocabulary: () => string[] } = {
  name: 'modelo-lsc',
  isSupported: true,
  // Cada resultado ya es una sena completa: el agente no tiene que verla
  // repetida varios frames para darla por buena.
  emitsCompleteSigns: true,

  async start(onResult: (result: GestureRecognition | null) => void) {
    await ensureReady();
    resetSegment();

    // Atajos para diagnosticar y calibrar desde la consola del navegador,
    // sin recompilar ni esperar a nadie.
    const consola = globalThis as unknown as {
      lscPeek?: () => string;
      lscTune?: (cambios?: Partial<Tuning>) => Tuning;
    };
    consola.lscPeek = enginePeek;
    consola.lscTune = (cambios?: Partial<Tuning>) => {
      if (cambios) Object.assign(tuning, cambios);
      return { ...tuning };
    };

    if (timer == null) {
      timer = setInterval(() => {
        const frame = sampleFrame();
        if (!frame) return;

        const sena = feed(frame);
        if (!sena) return;

        if (sampleSink) {
          // Se guarda ya remuestreada a 30 frames: es la forma exacta que
          // consume el modelo, y asi el reajuste no depende de repetir el
          // remuestreo igual en otro sitio.
          const sequence = resampleWindow(sena);
          if (sequence) sampleSink(sequence);
          return;
        }

        void classify(sena).then(onResult).catch(() => onResult(null));
      }, SAMPLE_INTERVAL_MS);
    }
  },

  stop() {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
    resetSegment();
    lastVideoTime = -1;
    lastSampleAt = 0;
  },

  /** Descarta la sena en curso sin apagar la camara. */
  reset() {
    resetSegment();
    lastPrediction = null;
  },

  vocabulary: () => glosses,
};

/**
 * Radiografia de lo que el motor esta viendo AHORA MISMO.
 *
 * Existe para comparar la camara contra el dataset con el que se entreno. Si
 * las cifras no se parecen, el modelo esta recibiendo algo que nunca vio, y
 * ante una entrada que no reconoce no se abstiene: se refugia siempre en la
 * misma palabra.
 *
 * Referencia medida sobre las 2306 muestras de LSC-54:
 *   manos vistas 71%, x muneca derecha -0.57, x muneca izquierda +0.51
 *
 * Se llama desde la consola del navegador: lscPeek()
 */
export const enginePeek = (): string => {
  const frames = segment.length ? segment : preRoll;
  if (frames.length === 0) {
    return 'sin frames: la camara no entrega imagenes con los hombros a la vista';
  }

  const promedio = (indice: number, bandera: number): string => {
    const vistos = frames.filter(f => f[bandera] > 0.5);
    if (vistos.length === 0) return 'sin datos';
    return (vistos.reduce((s, f) => s + f[indice], 0) / vistos.length).toFixed(2);
  };

  const conMano = frames.filter(f => f[126] > 0.5 || f[127] > 0.5).length;
  const lineas = [
    `senando ahora:     ${capturing ? `si, ${segment.length} frames` : 'no'}`,
    `con alguna mano:   ${((conMano / frames.length) * 100).toFixed(0)}%  (dataset: 71%)`,
    `mano derecha x:    ${promedio(0, 126)}  y: ${promedio(1, 126)}  (dataset x: -0.57)`,
    `mano izquierda x:  ${promedio(63, 127)}  y: ${promedio(64, 127)}  (dataset x: +0.51)`,
    `fps: ${perf.fps.toFixed(1)}  puntos: ${perf.landmarksMs.toFixed(0)} ms  modelo: ${perf.inferenceMs.toFixed(0)} ms`,
  ];

  if (lastProbas) {
    const orden = Array.from(lastProbas)
      .map((p, i) => ({ p, palabra: glosses[i] ?? `clase ${i}` }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 5)
      .map(x => `${x.palabra} ${(x.p * 100).toFixed(1)}%`);
    lineas.push(`ultima sena clasificada: ${orden.join(' | ')}`);
  }

  return lineas.join('\n');
};

/**
 * Permite saber si hay modelo servido antes de ofrecer este motor.
 *
 * Se pide glosas.json y no model.json por dos razones. Una, que es el archivo
 * pequeno (unos cientos de bytes) y hace falta de todos modos. Dos, que un
 * servidor de SPA responde el index.html con codigo 200 a cualquier ruta que
 * no existe, asi que "respondio bien" no prueba nada: lo que prueba que el
 * modelo esta es que el contenido sea de verdad la lista de palabras.
 */
export const isModelAvailable = async (): Promise<boolean> => {
  try {
    const res = await fetch(WORD_MODEL_URL.replace(/model\.json$/, 'glosas.json'));
    if (!res.ok) return false;
    const glosas: unknown = await res.json();
    return Array.isArray(glosas) && glosas.length > 0;
  } catch {
    return false;
  }
};
