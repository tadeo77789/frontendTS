import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const KEY = '@traduce_senas/gesture_templates_v2';
type Store = typeof import('../motionTemplateStore');

/** El módulo guarda una caché propia: cada prueba carga uno nuevo. */
const freshStore = (): Store => {
  let mod!: Store;
  jest.isolateModules(() => { mod = require('../motionTemplateStore'); });
  return mod;
};

const frames = (value = 0.1, { SEQ_LEN, FRAME_DIM }: Pick<Store, 'SEQ_LEN' | 'FRAME_DIM'> = { SEQ_LEN: 16, FRAME_DIM: 126 }) =>
  Array.from({ length: SEQ_LEN }, () => new Array(FRAME_DIM).fill(value));

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('gestureStore', () => {
  it('guarda, cuenta por palabra y persiste entre cargas', async () => {
    const { gestureStore } = freshStore();
    await gestureStore.add(' hola ', frames());
    await gestureStore.add('hola', frames(0.2));
    await gestureStore.add('casa', frames());

    expect(await gestureStore.countByLabel()).toEqual({ hola: 2, casa: 1 });
    const again = freshStore().gestureStore;
    expect((await again.getAll()).map(g => g.label)).toEqual(['hola', 'hola', 'casa']);
  });

  it('removeLabel borra todas las de una palabra y clear las borra todas', async () => {
    const { gestureStore } = freshStore();
    await gestureStore.add('hola', frames());
    await gestureStore.add('casa', frames());
    await gestureStore.removeLabel('hola');
    expect((await gestureStore.getAll()).map(g => g.label)).toEqual(['casa']);
    await gestureStore.clear();
    expect(await gestureStore.getAll()).toEqual([]);
  });

  it('un JSON corrupto en el almacenamiento se descarta', async () => {
    await AsyncStorage.setItem(KEY, '{roto');
    expect(await freshStore().gestureStore.getAll()).toEqual([]);
  });

  it('si no se puede leer, getAll devuelve [] y la siguiente lectura reintenta', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ gestures: [{ label: 'hola', frames: frames(), createdAt: 'x' }] }));
    const { gestureStore } = freshStore();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('sin acceso'));

    expect(await gestureStore.getAll()).toEqual([]);
    expect((await gestureStore.getAll()).map(g => g.label)).toEqual(['hola']);
  });

  it('si no se puede leer, add falla y no pisa lo guardado', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ gestures: [{ label: 'hola', frames: frames(), createdAt: 'x' }] }));
    const { gestureStore } = freshStore();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('sin acceso'));

    await expect(gestureStore.add('casa', frames())).rejects.toThrow('sin acceso');
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!).gestures).toHaveLength(1);
  });

  it('un fallo al escribir no rompe la app', async () => {
    const { gestureStore } = freshStore();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('lleno'));
    await expect(gestureStore.add('hola', frames())).resolves.toBeUndefined();
    expect(await gestureStore.countByLabel()).toEqual({ hola: 1 });
  });
});

describe('gestureStore: exportar e importar', () => {
  it('exportJSON e importJSON ida y vuelta', async () => {
    const a = freshStore().gestureStore;
    await a.add('hola', frames());
    const json = await a.exportJSON();
    expect(JSON.parse(json)).toMatchObject({ version: 1, gestures: [{ label: 'hola' }] });

    await AsyncStorage.clear();
    const b = freshStore().gestureStore;
    await expect(b.importJSON(json)).resolves.toBe(1);
    expect((await b.getAll()).map(g => g.label)).toEqual(['hola']);
  });

  it('merge suma a lo guardado y replace lo sustituye', async () => {
    const { gestureStore } = freshStore();
    await gestureStore.add('casa', frames());
    const json = JSON.stringify({ gestures: [{ label: 'hola', frames: frames(), createdAt: 'x' }] });

    await gestureStore.importJSON(json, 'merge');
    expect((await gestureStore.getAll()).map(g => g.label)).toEqual(['casa', 'hola']);
    await gestureStore.importJSON(json, 'replace');
    expect((await gestureStore.getAll()).map(g => g.label)).toEqual(['hola']);
  });

  it('descarta plantillas con forma incorrecta', async () => {
    const { gestureStore } = freshStore();
    const json = JSON.stringify({ gestures: [
      { label: 'buena', frames: frames() },
      { label: '  ', frames: frames() },
      { label: 'corta', frames: frames().slice(1) },
      { label: 'texto', frames: frames().map(f => f.map(String)) },
    ] });
    await expect(gestureStore.importJSON(json)).resolves.toBe(1);
  });

  it.each([
    ['no es JSON', '{', 'JSON inválido'],
    ['sin gestures', '{"otra":1}', 'falta el array "gestures"'],
    ['sin gestos válidos', '{"gestures":[{"label":"x"}]}', 'No se encontraron gestos válidos'],
  ])('rechaza un archivo %s', async (_name, json, message) => {
    await expect(freshStore().gestureStore.importJSON(json)).rejects.toThrow(message);
  });
});
