import AsyncStorage from '@react-native-async-storage/async-storage';
import { wordTakeStore } from '../wordTakeStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const KEY = '@traduce_senas/word_takes_v1';

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('wordTakeStore', () => {
  it('guarda las tomas con la etiqueta recortada y cuenta por palabra', async () => {
    await wordTakeStore.add(' HOLA ', [[0.1, 0.2]]);
    await wordTakeStore.add('HOLA', [[0.3, 0.4]]);
    await wordTakeStore.add('GRACIAS', [[0.5, 0.6]]);

    expect(await wordTakeStore.countByLabel()).toEqual({ HOLA: 2, GRACIAS: 1 });
    expect((await wordTakeStore.getAll()).map(t => t.label)).toEqual(['HOLA', 'HOLA', 'GRACIAS']);
  });

  it('redondea cada valor a 4 decimales y acepta Float32Array', async () => {
    await wordTakeStore.add('HOLA', [Float32Array.from([0.123456, 1]), [0.98765, -0.00004]]);

    const [take] = await wordTakeStore.getAll();
    // -0.00004 redondea a -0, que JSON guarda como 0.
    expect(take.frames).toEqual([[0.1235, 1], [0.9877, 0]]);
    expect(Number.isNaN(Date.parse(take.createdAt))).toBe(false);
  });

  it('removeLabel quita solo esa palabra y clear vacía la sala de espera', async () => {
    await wordTakeStore.add('HOLA', [[0.1]]);
    await wordTakeStore.add('GRACIAS', [[0.2]]);

    await wordTakeStore.removeLabel('HOLA');
    expect(await wordTakeStore.countByLabel()).toEqual({ GRACIAS: 1 });

    await wordTakeStore.clear();
    expect(await wordTakeStore.getAll()).toEqual([]);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('sin datos, con JSON roto o sin la lista de tomas devuelve una lista vacía', async () => {
    expect(await wordTakeStore.getAll()).toEqual([]);

    await AsyncStorage.setItem(KEY, '{no es json');
    expect(await wordTakeStore.getAll()).toEqual([]);

    await AsyncStorage.setItem(KEY, JSON.stringify({ takes: 'no es lista' }));
    expect(await wordTakeStore.countByLabel()).toEqual({});
  });
});
