
import type { Landmark } from './classifier';
import { normalizeLandmarks } from './normalize';
import { gestureStore, SEQ_LEN, FRAME_DIM } from './motionTemplateStore';

export interface MotionSample {

  t: number;

  staticLetter: string;

  palm: number;

  wrist: { x: number; y: number };
  indexTip: { x: number; y: number };
  pinkyTip: { x: number; y: number };

  features: Float32Array;
}

export interface MotionResult {

  letter: string;
  confidence: number;

  isWord: boolean;
}

const WINDOW_MS = 2200;

const MIN_SAMPLES = 8;

const MIN_STEP = 0.12;

let buffer: MotionSample[] = [];

let captureMode = false;
export const setGestureCaptureMode = (active: boolean): void => {
  captureMode = active;
};

const dist2D = (a: Landmark, b: Landmark): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const pushMotionSample = (landmarks: Landmark[], staticLetter: string): void => {
  if (!landmarks || landmarks.length < 21) return;
  const now = Date.now();
  buffer.push({
    t: now,
    staticLetter,
    palm: dist2D(landmarks[0], landmarks[9]) || 1e-6,
    wrist: { x: landmarks[0].x, y: landmarks[0].y },
    indexTip: { x: landmarks[8].x, y: landmarks[8].y },
    pinkyTip: { x: landmarks[20].x, y: landmarks[20].y },
    features: normalizeLandmarks(landmarks),
  });
  buffer = buffer.filter(s => now - s.t <= WINDOW_MS);
};

export const pushMotionGap = (): void => {
  buffer = [];
};

export const clearMotionBuffer = (): void => {
  buffer = [];
};

export const recentWristTravel = (ms = 450): number => {
  if (buffer.length < 2) return 0;
  const now = Date.now();
  const recent = buffer.filter(s => now - s.t <= ms);
  if (recent.length < 2) return 0;
  const palm = avgPalm(recent);
  let travel = 0;
  for (let i = 1; i < recent.length; i++) {
    travel += Math.hypot(
      recent[i].wrist.x - recent[i - 1].wrist.x,
      recent[i].wrist.y - recent[i - 1].wrist.y,
    );
  }
  return travel / palm;
};

const avgPalm = (samples: MotionSample[]): number =>
  samples.reduce((s, v) => s + v.palm, 0) / samples.length || 1e-6;

const axisStats = (
  values: number[],
  palm: number,
  minStep = MIN_STEP,
): { reversals: number; travel: number; net: number } => {
  let reversals = 0;
  let travel = 0;
  let lastDir = 0;
  let anchor = values[0];
  for (let i = 1; i < values.length; i++) {
    const step = (values[i] - anchor) / palm;
    if (Math.abs(step) < minStep) continue;
    const dir = Math.sign(step);
    if (lastDir !== 0 && dir !== lastDir) reversals++;
    lastDir = dir;
    travel += Math.abs(step);
    anchor = values[i];
  }
  return { reversals, travel, net: (values[values.length - 1] - values[0]) / palm };
};

const shapeRatio = (samples: MotionSample[], letters: string[]): number => {
  const hits = samples.filter(s => letters.includes(s.staticLetter)).length;
  return hits / samples.length;
};

const resampleSequence = (samples: MotionSample[]): number[][] | null => {
  if (samples.length < 2) return null;
  const out: number[][] = [];
  for (let i = 0; i < SEQ_LEN; i++) {
    const srcIdx = Math.min(
      samples.length - 1,
      Math.round((i * (samples.length - 1)) / (SEQ_LEN - 1)),
    );
    const f = samples[srcIdx].features;
    if (f.length !== FRAME_DIM) return null;
    out.push(Array.from(f));
  }
  return out;
};

const frameDist = (a: number[], b: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

const dtwDistance = (a: number[][], b: number[][]): number => {
  const n = a.length;
  const m = b.length;
  const BAND = 4;
  const INF = Number.POSITIVE_INFINITY;
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(INF));
  cost[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    const jMin = Math.max(1, i - BAND);
    const jMax = Math.min(m, i + BAND);
    for (let j = jMin; j <= jMax; j++) {
      const d = frameDist(a[i - 1], b[j - 1]);
      cost[i][j] = d + Math.min(cost[i - 1][j], cost[i][j - 1], cost[i - 1][j - 1]);
    }
  }

  return cost[n][m] / ((n + m) / 2);
};

/**
 * Distancia DTW maxima para dar por buena una palabra.
 *
 * El 1.1 original servia para plantillas grabadas por la misma persona en la
 * misma camara. Con plantillas de otras personas (dataset LSC-54) las
 * distancias de una misma sena van de 1.8 a 4.7, asi que ese liston rechazaba
 * todo. El 2.5 sale de medir el dataset con este mismo DTW
 * (backend: npm run ia:measure-lsc54). Se ajustara con la medicion completa.
 */
const MAX_GESTURE_DISTANCE = 2.5;

const matchWordGesture = async (samples: MotionSample[]): Promise<MotionResult | null> => {
  const templates = await gestureStore.getAll();
  if (templates.length === 0) return null;
  const seq = resampleSequence(samples);
  if (!seq) return null;

  let bestLabel = '';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const tpl of templates) {
    const d = dtwDistance(seq, tpl.frames);
    if (d < bestDist) {
      bestDist = d;
      bestLabel = tpl.label;
    }
  }

  if (!bestLabel || bestDist > MAX_GESTURE_DISTANCE) return null;

  // La confianza se mide contra el umbral, no en valor absoluto: una distancia
  // igual al umbral da exactamente 0.7, que es el minimo que acepta el agente.
  // Con la formula anterior (1 - d * 0.35) cualquier acierto del dataset
  // quedaba por debajo de 0.7 y se descartaba igual.
  const confidence = Math.min(0.95, Math.max(0.5, 1 - 0.3 * (bestDist / MAX_GESTURE_DISTANCE)));
  return { letter: bestLabel, confidence, isWord: true };
};

export const snapshotGestureSequence = (): number[][] | null => {
  if (buffer.length < MIN_SAMPLES) return null;
  return resampleSequence(buffer);
};

export const classifyMotion = async (): Promise<MotionResult | null> => {
  if (captureMode) return null;
  if (buffer.length < MIN_SAMPLES) return null;
  const samples = buffer;
  const palm = avgPalm(samples);

  const word = await matchWordGesture(samples);
  if (word && word.confidence >= 0.7) {
    clearMotionBuffer();
    return word;
  }

  const wristX = axisStats(samples.map(s => s.wrist.x), palm);
  const wristY = axisStats(samples.map(s => s.wrist.y), palm);

  if (
    shapeRatio(samples, ['R']) >= 0.3 &&
    shapeRatio(samples, ['R', 'U', 'V', '']) >= 0.7 &&
    wristX.reversals >= 2 &&
    wristX.travel >= 0.8 &&
    Math.abs(wristX.net) <= 0.8 &&
    wristY.travel <= wristX.travel * 0.7
  ) {
    const result: MotionResult = { letter: 'RR', confidence: 0.78, isWord: false };
    clearMotionBuffer();
    return result;
  }

  const indexX = axisStats(samples.map(s => s.indexTip.x), palm);
  const indexY = axisStats(samples.map(s => s.indexTip.y), palm);
  if (
    shapeRatio(samples, ['D', 'G', '']) >= 0.6 &&
    shapeRatio(samples, ['D', 'G']) >= 0.35 &&
    indexX.reversals >= 2 &&
    indexX.travel >= 1.3 &&
    indexY.net >= 0.35
  ) {
    const result: MotionResult = { letter: 'Z', confidence: 0.8, isWord: false };
    clearMotionBuffer();
    return result;
  }

  const pinkyX = axisStats(samples.map(s => s.pinkyTip.x), palm);
  const pinkyY = axisStats(samples.map(s => s.pinkyTip.y), palm);
  if (
    shapeRatio(samples, ['I', 'Y', '']) >= 0.6 &&
    shapeRatio(samples, ['I', 'Y']) >= 0.35 &&
    pinkyY.net >= 0.45 &&
    pinkyX.travel >= 0.35 &&
    pinkyX.reversals <= 2
  ) {
    const result: MotionResult = { letter: 'J', confidence: 0.78, isWord: false };
    clearMotionBuffer();
    return result;
  }

  return null;
};
