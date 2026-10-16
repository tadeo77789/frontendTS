/**
 * Motor de gestos-palabra para web: MediaPipe Gesture Recognizer sobre el
 * <video> que monta expo-camera.
 *
 * Se lee el video directamente (en vez de `takePictureAsync`) porque el modelo
 * corre en `runningMode: 'VIDEO'` y la estabilizacion necesita decenas de
 * frames por segundo, no una foto cada segundo y medio.
 */

// `@mediapipe/tasks-vision` esta declarado en package.json y se usa SOLO como
// fuente de tipos: `import type` se borra al compilar, asi que el paquete no
// entra al bundle. El codigo real se baja del CDN en runtime (ver abajo), que
// es lo que evita tener que servir los .wasm desde node_modules.
import type {
  FilesetResolver,
  GestureRecognizer,
  GestureRecognizerOptions,
} from '@mediapipe/tasks-vision';

import { GESTURE_MODEL_URL, MEDIAPIPE_VISION_CDN } from '../../../../app/config/api.config';
import { lookupGestureWord } from './gestureDictionary';
import type { GestureEngine, GestureRecognition } from './gestureProvider';

const MODULE_URL = `${MEDIAPIPE_VISION_CDN}/vision_bundle.mjs`;
const WASM_BASE = `${MEDIAPIPE_VISION_CDN}/wasm`;

/** Subconjunto del modulo que realmente se usa. */
interface MpModule {
  FilesetResolver: typeof FilesetResolver;
  GestureRecognizer: typeof GestureRecognizer;
}

// `import()` construido en runtime: si se deja literal, Metro intenta resolver
// la URL del CDN en build time y falla.
const loadMpModule = (): Promise<MpModule> => {
  const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<MpModule>;
  return dynImport(MODULE_URL);
};

let recognizer: GestureRecognizer | null = null;
let initPromise: Promise<GestureRecognizer> | null = null;
let rafId: number | null = null;
let lastVideoTime = -1;

const createRecognizer = async (): Promise<GestureRecognizer> => {
  const mp = await loadMpModule();
  const vision = await mp.FilesetResolver.forVisionTasks(WASM_BASE);

  const build = (delegate: 'GPU' | 'CPU') => {
    const options: GestureRecognizerOptions = {
      baseOptions: { modelAssetPath: GESTURE_MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numHands: 1,
    };
    return mp.GestureRecognizer.createFromOptions(vision, options);
  };

  try {
    return await build('GPU');
  } catch {
    // Navegadores sin WebGL disponible (o con la GPU bloqueada) igual sirven
    // para la demo con el delegate de CPU.
    return build('CPU');
  }
};

const getRecognizer = (): Promise<GestureRecognizer> => {
  if (recognizer) return Promise.resolve(recognizer);
  if (!initPromise) {
    initPromise = createRecognizer()
      .then(r => {
        recognizer = r;
        return r;
      })
      .catch(err => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
};

/** El <video> de expo-camera es el unico reproduciendo con dimensiones reales. */
const findActiveVideo = (): HTMLVideoElement | null => {
  const videos = Array.from(document.querySelectorAll('video'));
  return videos.find(v => v.readyState >= 2 && v.videoWidth > 0 && !v.paused) ?? null;
};

export const gestureEngine: GestureEngine = {
  name: 'mediapipe-gesture-recognizer',
  isSupported: true,

  async start(onResult: (result: GestureRecognition | null) => void) {
    const engine = await getRecognizer();

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      const video = findActiveVideo();
      if (!video) return;

      // `recognizeForVideo` exige timestamps estrictamente crecientes: si el
      // frame no avanzo, se omite en vez de reprocesar el mismo instante.
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;

      try {
        const res = engine.recognizeForVideo(video, performance.now());
        const top = res.gestures?.[0]?.[0];
        const word = lookupGestureWord(top?.categoryName);

        if (!top || !word) {
          onResult(null);
          return;
        }

        onResult({ categoryName: top.categoryName, word, score: top.score });
      } catch {
        onResult(null);
      }
    };

    if (rafId == null) rafId = requestAnimationFrame(tick);
  },

  stop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastVideoTime = -1;
  },
};
