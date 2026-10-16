import type { Landmark } from '../classifier';
import { euclidean, normalizeLandmarks, normalizeTwoHands } from '../normalize';

// Mano sintética: muñeca en (0.5, 0.5, 0) y el nudillo medio (punto 9) 0.2 más arriba.
const hand = (offset = { x: 0, y: 0 }, scale = 1): Landmark[] =>
  Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + offset.x + (i === 9 ? 0 : i * 0.01) * scale,
    y: 0.5 + offset.y - (i === 9 ? 0.2 : i * 0.005) * scale,
    z: i * 0.001 * scale,
  }));

describe('normalizeLandmarks', () => {
  it('devuelve 63 valores (21 puntos x 3 ejes)', () => {
    expect(normalizeLandmarks(hand())).toHaveLength(63);
  });

  it('la muñeca queda en el origen', () => {
    const out = normalizeLandmarks(hand());
    expect(Array.from(out.slice(0, 3))).toEqual([0, 0, 0]);
  });

  it('la distancia muñeca–nudillo medio queda en 1', () => {
    const out = normalizeLandmarks(hand());
    expect(Math.hypot(out[27], out[28], out[29])).toBeCloseTo(1, 5);
  });

  it('no depende de dónde esté la mano ni de su tamaño en la imagen', () => {
    const base = normalizeLandmarks(hand());
    const moved = normalizeLandmarks(hand({ x: 0.2, y: -0.1 }, 2));
    expect(euclidean(base, moved)).toBeCloseTo(0, 5);
  });

  it('con menos de 21 puntos devuelve ceros', () => {
    expect(Array.from(normalizeLandmarks(hand().slice(0, 10))).every((v) => v === 0)).toBe(true);
  });

  it('si muñeca y nudillo coinciden no divide entre cero', () => {
    const degenerate = hand().map(() => ({ x: 0.3, y: 0.3, z: 0 }));
    expect(Array.from(normalizeLandmarks(degenerate)).every(Number.isFinite)).toBe(true);
  });
});

describe('normalizeTwoHands', () => {
  it('devuelve 126 valores: primero la mano dominante y luego la otra', () => {
    const dominant = hand();
    const other = hand({ x: 0.1, y: 0 }, 0.5);
    const out = normalizeTwoHands(dominant, other);
    expect(out).toHaveLength(126);
    expect(Array.from(out.slice(0, 63))).toEqual(Array.from(normalizeLandmarks(dominant)));
    expect(Array.from(out.slice(63))).toEqual(Array.from(normalizeLandmarks(other)));
  });

  it('sin segunda mano la otra mitad son ceros', () => {
    const out = normalizeTwoHands(hand(), null);
    expect(Array.from(out.slice(63)).every((v) => v === 0)).toBe(true);
  });
});

describe('euclidean', () => {
  it('calcula la distancia entre dos vectores', () => {
    expect(euclidean(Float32Array.from([0, 0]), Float32Array.from([3, 4]))).toBe(5);
    expect(euclidean(Float32Array.from([1, 2, 3]), Float32Array.from([1, 2, 3]))).toBe(0);
  });
});
