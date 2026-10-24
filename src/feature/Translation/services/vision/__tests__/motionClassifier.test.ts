import type { Landmark } from '../classifier';
import {
  classifyMotion, clearMotionBuffer, getLastWordMatch, pushMotionGap, pushMotionSample,
  recentWristTravel, setGestureCaptureMode, snapshotGestureSequence,
} from '../motionClassifier';
import { FRAME_DIM, SEQ_LEN, gestureStore } from '../motionTemplateStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

type P = [number, number];
const PALM = 0.2;

/** Mano mínima: muñeca, nudillo del medio (tamaño de palma), punta del índice y del meñique. */
const frame = (wrist: P, indexTip: P = [wrist[0] - 0.05, wrist[1] - 0.35], pinkyTip: P = [wrist[0] + 0.1, wrist[1] - 0.25]): Landmark[] =>
  Array.from({ length: 21 }, (_, i) => {
    const [x, y] = i === 0 ? wrist
      : i === 9 ? [wrist[0], wrist[1] - PALM]
      : i === 8 ? indexTip
      : i === 20 ? pinkyTip
      : [wrist[0] + 0.01 * (i % 5), wrist[1] - 0.01 * i];
    return { x, y, z: 0 };
  });

let now = new Date('2026-10-24T12:00:00Z').getTime();
/** Empuja una muestra cada 100 ms (la ventana es de 2,2 s). */
const push = (lm: Landmark[], letter: string) => {
  now += 100;
  jest.setSystemTime(now);
  pushMotionSample(lm, null, letter);
};

beforeEach(async () => {
  jest.useFakeTimers({ now });
  clearMotionBuffer();
  setGestureCaptureMode(false);
  await gestureStore.clear();
});
afterEach(() => jest.useRealTimers());

describe('buffer de movimiento', () => {
  it('ignora manos incompletas y no clasifica con menos de 8 muestras', async () => {
    pushMotionSample(frame([0.5, 0.8]).slice(0, 10), null, 'A');
    for (let i = 0; i < 7; i++) push(frame([0.5, 0.8]), 'R');
    expect(snapshotGestureSequence()).toBeNull();
    await expect(classifyMotion()).resolves.toBeNull();
  });

  it('descarta las muestras de más de 2,2 s', () => {
    for (let i = 0; i < 8; i++) push(frame([0.5, 0.8]), 'A');
    now += 3000;
    push(frame([0.5, 0.8]), 'A');
    expect(snapshotGestureSequence()).toBeNull();
  });

  it('un hueco (mano fuera de cuadro) vacía el buffer', () => {
    for (let i = 0; i < 10; i++) push(frame([0.5, 0.8]), 'A');
    pushMotionGap();
    expect(recentWristTravel()).toBe(0);
    expect(snapshotGestureSequence()).toBeNull();
  });

  it('recentWristTravel mide el recorrido reciente de la muñeca en palmas', () => {
    expect(recentWristTravel()).toBe(0);
    push(frame([0.5, 0.8]), 'A');
    push(frame([0.6, 0.8]), 'A');
    push(frame([0.6, 0.9]), 'A');
    expect(recentWristTravel()).toBeCloseTo(0.2 / PALM, 5);
  });

  it('snapshotGestureSequence remuestrea a 16 cuadros de 126 valores', () => {
    for (let i = 0; i < 12; i++) push(frame([0.5 + i * 0.01, 0.8]), 'A');
    const seq = snapshotGestureSequence()!;
    expect(seq).toHaveLength(SEQ_LEN);
    expect(seq.every(f => f.length === FRAME_DIM)).toBe(true);
  });
});

describe('letras con movimiento', () => {
  it('RR: forma de R con la muñeca de lado a lado', async () => {
    for (let i = 0; i < 10; i++) push(frame([i % 2 ? 0.6 : 0.5, 0.8]), 'R');
    await expect(classifyMotion()).resolves.toEqual({ letter: 'RR', confidence: 0.78, isWord: false });
    // Reconocida la letra, el buffer se vacía para no repetirla.
    await expect(classifyMotion()).resolves.toBeNull();
  });

  it('Z: índice en zigzag que baja', async () => {
    for (let i = 0; i < 10; i++) push(frame([0.5, 0.8], [i % 2 ? 0.7 : 0.5, 0.3 + i * 0.012]), 'D');
    await expect(classifyMotion()).resolves.toMatchObject({ letter: 'Z', isWord: false });
  });

  it('J: meñique que baja y se curva', async () => {
    for (let i = 0; i < 10; i++) push(frame([0.5, 0.8], undefined, [0.6 + i * 0.012, 0.55 + i * 0.012]), 'I');
    await expect(classifyMotion()).resolves.toMatchObject({ letter: 'J', isWord: false });
  });

  it('sin una forma que acompañe, el movimiento no es una letra', async () => {
    for (let i = 0; i < 10; i++) push(frame([i % 2 ? 0.6 : 0.5, 0.8]), 'B');
    await expect(classifyMotion()).resolves.toBeNull();
  });

  it('en modo captura no clasifica (se está grabando una plantilla)', async () => {
    setGestureCaptureMode(true);
    for (let i = 0; i < 10; i++) push(frame([i % 2 ? 0.6 : 0.5, 0.8]), 'R');
    await expect(classifyMotion()).resolves.toBeNull();
  });
});

describe('palabras por plantilla (DTW)', () => {
  const record = () => {
    for (let i = 0; i < 12; i++) push(frame([0.5 + i * 0.02, 0.8 - i * 0.01]), '');
    return snapshotGestureSequence()!;
  };

  it('una secuencia igual a la plantilla se reconoce como palabra', async () => {
    await gestureStore.add('hola', record());
    clearMotionBuffer();
    record();

    const result = await classifyMotion();

    expect(result).toEqual({ letter: 'hola', confidence: 0.95, isWord: true });
    expect(getLastWordMatch()).toMatchObject({ label: 'hola', accepted: true });
  });

  it('una secuencia muy distinta no se acepta, pero queda el diagnóstico', async () => {
    await gestureStore.add('lejos', Array.from({ length: SEQ_LEN }, () => new Array(FRAME_DIM).fill(5)));
    record();

    await expect(classifyMotion()).resolves.toBeNull();
    expect(getLastWordMatch()).toMatchObject({ label: 'lejos', accepted: false });
    // El diagnóstico caduca.
    now += 5000;
    jest.setSystemTime(now);
    expect(getLastWordMatch()).toBeNull();
  });
});
