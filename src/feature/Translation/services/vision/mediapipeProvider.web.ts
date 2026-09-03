
import { classifyLetterLSC, type Landmark } from './classifier';
import { normalizeLandmarks } from './normalize';
import { knnClassify } from './knnClassifier';
import {
  pushMotionSample,
  pushMotionGap,
  clearMotionBuffer,
  classifyMotion,
  recentWristTravel,
} from './motionClassifier';
import type { SignDetectionResult, SignVisionProvider, VisionFrame } from './types';

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODULE_URL = `${CDN_BASE}/vision_bundle.mjs`;
const WASM_BASE = `${CDN_BASE}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

interface MpLandmark { x: number; y: number; z: number }

interface MpHandLandmarker {
  detect(image: HTMLImageElement | HTMLCanvasElement): {
    landmarks: MpLandmark[][];
  };
  close(): void;
}

interface MpModule {
  FilesetResolver: {
    forVisionTasks(wasmPath: string): Promise<unknown>;
  };
  HandLandmarker: {
    createFromOptions(vision: unknown, opts: object): Promise<MpHandLandmarker>;
  };
}

let landmarker: MpHandLandmarker | null = null;
let initPromise: Promise<MpHandLandmarker> | null = null;

const loadMpModule = (): Promise<MpModule> => {
  const dynImport = new Function('u', 'return import(u)') as (u: string) => Promise<MpModule>;
  return dynImport(MODULE_URL);
};

const getLandmarker = (): Promise<MpHandLandmarker> => {
  if (landmarker) return Promise.resolve(landmarker);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mp = await loadMpModule();
    const vision = await mp.FilesetResolver.forVisionTasks(WASM_BASE);
    const lm = await mp.HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      numHands: 1,
      runningMode: 'IMAGE',
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    landmarker = lm;
    return lm;
  })();

  return initPromise;
};

const loadImage = (base64: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode frame'));
    img.src = base64.startsWith('data:')
      ? base64
      : `data:image/jpeg;base64,${base64}`;
  });

const MOTION_SAMPLE_MS = 120;
const MOTION_IDLE_STOP_MS = 5000;
const SAMPLE_MAX_WIDTH = 320;

const MOVING_TRAVEL_THRESHOLD = 0.5;

let motionTimer: ReturnType<typeof setInterval> | null = null;
let lastDetectAt = 0;
let samplingBusy = false;
let sampleCanvas: HTMLCanvasElement | null = null;

const findActiveVideo = (): HTMLVideoElement | null => {
  const videos = Array.from(document.querySelectorAll('video'));
  return videos.find(v => v.readyState >= 2 && v.videoWidth > 0 && !v.paused) ?? null;
};

const stopMotionLoop = (): void => {
  if (motionTimer != null) {
    clearInterval(motionTimer);
    motionTimer = null;
  }
  clearMotionBuffer();
};

const sampleMotionFrame = (): void => {
  if (samplingBusy) return;
  if (Date.now() - lastDetectAt > MOTION_IDLE_STOP_MS) {
    stopMotionLoop();
    return;
  }
  if (!landmarker) return;
  const video = findActiveVideo();
  if (!video) return;

  samplingBusy = true;
  try {
    const scale = Math.min(1, SAMPLE_MAX_WIDTH / video.videoWidth);
    const w = Math.max(1, Math.round(video.videoWidth * scale));
    const h = Math.max(1, Math.round(video.videoHeight * scale));
    if (!sampleCanvas) sampleCanvas = document.createElement('canvas');
    if (sampleCanvas.width !== w) sampleCanvas.width = w;
    if (sampleCanvas.height !== h) sampleCanvas.height = h;
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const res = landmarker.detect(sampleCanvas);
    if (!res.landmarks || res.landmarks.length === 0) {
      pushMotionGap();
      return;
    }
    const hand = res.landmarks[0] as Landmark[];
    pushMotionSample(hand, classifyLetterLSC(hand).letter);
  } catch {

  } finally {
    samplingBusy = false;
  }
};

const ensureMotionLoop = (): void => {
  if (motionTimer != null) return;
  motionTimer = setInterval(sampleMotionFrame, MOTION_SAMPLE_MS);
};

export const mediapipeProvider: SignVisionProvider = {
  name: 'mediapipe-web',

  async init() {
    await getLandmarker();
  },

  async detect(frame: VisionFrame): Promise<SignDetectionResult> {

    lastDetectAt = Date.now();
    ensureMotionLoop();

    try {
      const motion = await classifyMotion();
      if (motion && motion.confidence >= 0.7) {
        return {
          text: motion.letter,
          confidence: motion.confidence,
          status: 'detecting',
          timestamp: frame.capturedAt,
          source: 'motion',
        };
      }
    } catch {

    }

    if (frame.base64.startsWith('synthetic-') || frame.base64.length < 100) {
      return {
        text: '',
        confidence: 0,
        status: 'no_hands',
        timestamp: frame.capturedAt,
      };
    }

    try {
      const lm = await getLandmarker();
      const img = await loadImage(frame.base64);
      const result = lm.detect(img);

      if (!result.landmarks || result.landmarks.length === 0) {
        return {
          text: '',
          confidence: 0,
          status: 'no_hands',
          timestamp: frame.capturedAt,
        };
      }

      const hand = result.landmarks[0] as Landmark[];
      const features = normalizeLandmarks(hand);
      const featuresArray = Array.from(features);

      const handIsMoving = recentWristTravel() >= MOVING_TRAVEL_THRESHOLD;

      const knn = await knnClassify(features);
      if (knn.used && knn.letter && knn.confidence >= 0.55) {
        return {
          text: knn.letter,
          confidence: knn.confidence,
          status: !handIsMoving && knn.confidence >= 0.7 ? 'detecting' : 'low_confidence',
          timestamp: frame.capturedAt,
          features: featuresArray,
          source: 'knn',
        };
      }

      const geo = classifyLetterLSC(hand);
      if (!geo.letter) {
        return {
          text: '',
          confidence: geo.confidence,
          status: 'low_confidence',
          timestamp: frame.capturedAt,
          features: featuresArray,
          source: 'geometric',
        };
      }

      return {
        text: geo.letter,
        confidence: geo.confidence,
        status: !handIsMoving && geo.confidence >= 0.7 ? 'detecting' : 'low_confidence',
        timestamp: frame.capturedAt,
        features: featuresArray,
        source: 'geometric',
      };
    } catch {
      return {
        text: '',
        confidence: 0,
        status: 'error',
        timestamp: frame.capturedAt,
      };
    }
  },

  dispose() {
    stopMotionLoop();
    landmarker?.close();
    landmarker = null;
    initPromise = null;
  },
};
