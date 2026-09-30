
import type { Landmark } from './classifier';

const FEATURE_LEN = 63;

export const normalizeLandmarks = (landmarks: Landmark[]): Float32Array => {
  const out = new Float32Array(FEATURE_LEN);
  if (!landmarks || landmarks.length < 21) return out;

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const dz = middleMcp.z - wrist.z;
  const scale = Math.hypot(dx, dy, dz) || 1;

  for (let i = 0; i < 21; i++) {
    const lm = landmarks[i];
    const idx = i * 3;
    out[idx] = (lm.x - wrist.x) / scale;
    out[idx + 1] = (lm.y - wrist.y) / scale;
    out[idx + 2] = (lm.z - wrist.z) / scale;
  }

  return out;
};

/** Una mano ausente aporta ceros: asi no suma distancia en las senas de una sola mano. */
const EMPTY_HAND = new Float32Array(FEATURE_LEN);

/**
 * Rasgos de las DOS manos: 126 valores (dominante + la otra).
 *
 * La mayoria de las senas de LSC son bimanuales; mirando una sola mano el
 * motor tiraba la mitad de la informacion. Medido sobre LSC-54, pasar a dos
 * manos sube de 3 a 4 las senas distinguibles de cada 5, y "bano" pasa de un
 * margen de 0,29 a 1,63.
 */
export const normalizeTwoHands = (
  dominant: Landmark[],
  other: Landmark[] | null,
): Float32Array => {
  const out = new Float32Array(FEATURE_LEN * 2);
  out.set(normalizeLandmarks(dominant), 0);
  out.set(other ? normalizeLandmarks(other) : EMPTY_HAND, FEATURE_LEN);
  return out;
};

export const euclidean = (a: Float32Array, b: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};
