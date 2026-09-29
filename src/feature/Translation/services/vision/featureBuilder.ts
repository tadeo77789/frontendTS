/**
 * Arma los rasgos que espera el modelo entrenado.
 *
 * Es la copia en vivo de `extract_landmarks.py` del backend. Si los dos
 * archivos dejan de coincidir, el modelo recibe algo distinto de lo que
 * aprendió y la exactitud medida en el entrenamiento no significa nada.
 * Contrato completo en docs/06-data/model-input-format.md.
 */

import type { Landmark } from './classifier';

/** Frames por secuencia, ya remuestreados. */
export const SEQ_LEN = 30;

/** Ritmo al que se alimenta el modelo: 30 frames en 2 segundos. */
export const SAMPLE_INTERVAL_MS = 67;

const HAND_POINTS = 21;
const HAND_DIM = HAND_POINTS * 3;

/** 126 coordenadas (2 manos) + 2 banderas de presencia. */
export const FEATURE_DIM = HAND_DIM * 2 + 2;

/** Indices de MediaPipe Pose. */
export const POSE_LEFT_SHOULDER = 11;
export const POSE_RIGHT_SHOULDER = 12;
export const POSE_LEFT_WRIST = 15;
export const POSE_RIGHT_WRIST = 16;

export interface HandsAndPose {
  hands: Landmark[][];
  pose: Landmark[] | null;
}

const distance2D = (a: Landmark, b: Landmark): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Reparte las manos detectadas segun a que muneca del torso estan mas cerca.
 *
 * No se usa la etiqueta de MediaPipe: su convencion supone imagen en espejo,
 * y los videos de entrenamiento no lo estan. Repartir por cercania es la
 * misma regla que aplico el extractor, asi que las dos fuentes coinciden.
 */
export const splitHandsByPose = (
  hands: Landmark[][],
  pose: Landmark[],
): { right: Landmark[] | null; left: Landmark[] | null } => {
  let right: Landmark[] | null = null;
  let left: Landmark[] | null = null;

  for (const hand of hands) {
    const wrist = hand[0];
    const toRight = distance2D(wrist, pose[POSE_RIGHT_WRIST]);
    const toLeft = distance2D(wrist, pose[POSE_LEFT_WRIST]);
    if (toRight <= toLeft) {
      if (!right) right = hand;
    } else if (!left) {
      left = hand;
    }
  }

  return { right, left };
};

/**
 * Una mano llevada al marco de los hombros. Ausente = ceros, que es un valor
 * que ninguna mano real ocupa porque el origen es el centro de los hombros.
 */
const normaliseHand = (
  hand: Landmark[] | null,
  centreX: number,
  centreY: number,
  scale: number,
  out: Float32Array,
  offset: number,
): void => {
  if (!hand) return;
  for (let i = 0; i < HAND_POINTS; i++) {
    const p = hand[i];
    const base = offset + i * 3;
    out[base] = (p.x - centreX) / scale;
    out[base + 1] = (p.y - centreY) / scale;
    // z ya viene relativo a la muneca: solo se reescala, nunca se traslada.
    out[base + 2] = p.z / scale;
  }
};

/** Un frame -> 128 valores. Devuelve null si no hay hombros que sirvan de marco. */
export const buildFrameFeatures = ({ hands, pose }: HandsAndPose): Float32Array | null => {
  if (!pose || pose.length <= POSE_RIGHT_SHOULDER) return null;

  const ls = pose[POSE_LEFT_SHOULDER];
  const rs = pose[POSE_RIGHT_SHOULDER];
  const scale = distance2D(ls, rs);
  if (!(scale > 0)) return null;

  const { right, left } = splitHandsByPose(hands, pose);
  const out = new Float32Array(FEATURE_DIM);
  const centreX = (ls.x + rs.x) / 2;
  const centreY = (ls.y + rs.y) / 2;

  normaliseHand(right, centreX, centreY, scale, out, 0);
  normaliseHand(left, centreX, centreY, scale, out, HAND_DIM);
  out[126] = right ? 1 : 0;
  out[127] = left ? 1 : 0;

  return out;
};

/**
 * Remuestrea la ventana a SEQ_LEN frames: interpolacion lineal en las
 * coordenadas y vecino mas cercano en las banderas, que son 0 o 1 y no
 * admiten valores intermedios.
 */
export const resampleWindow = (frames: Float32Array[]): Float32Array[] | null => {
  if (frames.length < 2) return null;
  if (frames.length === SEQ_LEN) return frames;

  const out: Float32Array[] = [];
  const last = frames.length - 1;

  for (let i = 0; i < SEQ_LEN; i++) {
    const t = (i * last) / (SEQ_LEN - 1);
    const lo = Math.floor(t);
    const hi = Math.min(last, lo + 1);
    const w = t - lo;

    const row = new Float32Array(FEATURE_DIM);
    for (let c = 0; c < 126; c++) row[c] = frames[lo][c] * (1 - w) + frames[hi][c] * w;
    const nearest = frames[Math.min(last, Math.round(t))];
    row[126] = nearest[126];
    row[127] = nearest[127];
    out.push(row);
  }

  return out;
};

/** Aplana la secuencia en el arreglo plano que recibe el modelo. */
export const flattenSequence = (frames: Float32Array[]): Float32Array => {
  const out = new Float32Array(SEQ_LEN * FEATURE_DIM);
  frames.forEach((f, i) => out.set(f, i * FEATURE_DIM));
  return out;
};
