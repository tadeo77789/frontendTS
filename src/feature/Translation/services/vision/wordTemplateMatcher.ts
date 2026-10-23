/**
 * Palabras agregadas desde el admin sin reentrenar el modelo.
 *
 * El modelo propio solo conoce las glosas con las que se entreno: una sena
 * nueva, como *triste*, la confunde con la que mas se le parezca. Para no
 * esperar a un reentrenamiento, el admin graba unas tomas de la palabra con
 * el mismo motor que traduce (30 frames de 128 valores, ver featureBuilder.ts)
 * y aqui se comparan contra la sena en vivo con DTW, antes de preguntarle al
 * modelo.
 *
 * Es independiente de la plataforma: no toca la camara ni la red. Las
 * plantillas las carga wordTemplates.service.ts.
 */

import { FEATURE_DIM, SEQ_LEN } from './featureBuilder';

export interface WordTemplate {
  label: string;
  frames: number[][];
}

export interface WordTemplateMatch {
  label: string;
  distance: number;
}

let templates: WordTemplate[] = [];

const isValid = (t: WordTemplate): boolean =>
  typeof t?.label === 'string' &&
  t.label.trim().length > 0 &&
  Array.isArray(t.frames) &&
  t.frames.length === SEQ_LEN &&
  t.frames.every(f => Array.isArray(f) && f.length === FEATURE_DIM);

/** Reemplaza las plantillas en memoria; descarta las que no tengan el formato del modelo. */
export const setWordTemplates = (list: WordTemplate[]): void => {
  templates = list.filter(isValid).map(t => ({ label: t.label.trim(), frames: t.frames }));
};

/** Palabras distintas que hay en las plantillas cargadas. */
export const wordTemplateLabels = (): string[] => [...new Set(templates.map(t => t.label))];

const frameDist = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

/**
 * DTW con banda, normalizado por la longitud media. Es el mismo calculo que
 * motionClassifier.ts usa con las plantillas del motor viejo.
 */
const dtwDistance = (a: ArrayLike<number>[], b: ArrayLike<number>[]): number => {
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

/** Plantilla mas cercana a la sena (ya remuestreada a 30 frames), o null si no hay plantillas. */
export const matchWordTemplate = (sequence: ArrayLike<number>[]): WordTemplateMatch | null => {
  let best: WordTemplateMatch | null = null;
  for (const tpl of templates) {
    const distance = dtwDistance(sequence, tpl.frames);
    if (!best || distance < best.distance) best = { label: tpl.label, distance };
  }
  return best;
};

/**
 * Confianza que se muestra para una plantilla aceptada: se mide contra el
 * umbral, asi que justo en el umbral da 0.7, el minimo que acepta el agente.
 */
export const templateConfidence = (distance: number, maxDistance: number): number =>
  Math.min(0.95, Math.max(0.5, 1 - 0.3 * (distance / maxDistance)));
