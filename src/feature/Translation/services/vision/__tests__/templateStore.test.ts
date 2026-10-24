import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const KEY = '@traduce_senas/sign_templates_v1';
type Store = typeof import('../templateStore');

/** El módulo guarda una caché propia: cada prueba carga uno nuevo. */
const freshStore = (): Store['templateStore'] => {
  let mod!: Store;
  jest.isolateModules(() => { mod = require('../templateStore'); });
  return mod.templateStore;
};

const features = (value = 0.1) => new Float32Array(63).fill(value);
const saved = (label: string) => ({ label, features: Array.from(features()), createdAt: 'x' });

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('templateStore', () => {
  it('guarda, cuenta por letra y persiste entre cargas', async () => {
    const store = freshStore();
    await store.add('A', features());
    await store.add('A', features(0.2));
    await store.add('B', features());

    expect(await store.countByLabel()).toEqual({ A: 2, B: 1 });
    expect((await freshStore().getAll()).map(t => t.label)).toEqual(['A', 'A', 'B']);
  });

  it('removeLabel y clear', async () => {
    const store = freshStore();
    await store.add('A', features());
    await store.add('B', features());
    await store.removeLabel('A');
    expect((await store.getAll()).map(t => t.label)).toEqual(['B']);
    await store.clear();
    expect(await freshStore().getAll()).toEqual([]);
  });

  it('un JSON corrupto o sin la lista se trata como vacío', async () => {
    await AsyncStorage.setItem(KEY, '{roto');
    expect(await freshStore().getAll()).toEqual([]);
    await AsyncStorage.setItem(KEY, '{"otra":1}');
    expect(await freshStore().getAll()).toEqual([]);
  });

  it('un fallo al escribir no rompe la app', async () => {
    const store = freshStore();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('lleno'));
    await expect(store.add('A', features())).resolves.toBeUndefined();
  });

  it('si no se puede leer, add falla y no pisa las plantillas guardadas', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ templates: [saved('A'), saved('B')] }));
    const store = freshStore();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('sin acceso'));

    await expect(store.add('C', features())).rejects.toThrow('sin acceso');

    expect(JSON.parse((await AsyncStorage.getItem(KEY))!).templates).toHaveLength(2);
  });

  it('si no se puede leer, getAll y countByLabel devuelven vacío y la siguiente lectura reintenta', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ templates: [saved('A')] }));
    const store = freshStore();
    jest.spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('sin acceso'))
      .mockRejectedValueOnce(new Error('sin acceso'));

    expect(await store.getAll()).toEqual([]);
    expect(await store.countByLabel()).toEqual({});
    expect((await store.getAll()).map(t => t.label)).toEqual(['A']);
  });

  it('si no se puede leer, importar combinando falla y reemplazando funciona', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ templates: [saved('A')] }));
    const json = JSON.stringify({ templates: [saved('B')] });
    const store = freshStore();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('sin acceso'));

    await expect(store.importJSON(json, 'merge')).rejects.toThrow('sin acceso');
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!).templates).toHaveLength(1);

    const other = freshStore();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('sin acceso'));
    await expect(other.importJSON(json, 'replace')).resolves.toBe(1);
    expect((await other.getAll()).map(t => t.label)).toEqual(['B']);
  });
});

describe('templateStore: exportar e importar', () => {
  it('exportJSON e importJSON ida y vuelta', async () => {
    const a = freshStore();
    await a.add('A', features());
    const json = await a.exportJSON();
    expect(JSON.parse(json)).toMatchObject({ version: 1, templates: [{ label: 'A' }] });

    await AsyncStorage.clear();
    const b = freshStore();
    await expect(b.importJSON(json)).resolves.toBe(1);
    expect((await b.getAll()).map(t => t.label)).toEqual(['A']);
  });

  it('merge suma, replace sustituye y sin fecha se pone la actual', async () => {
    const store = freshStore();
    await store.add('A', features());
    const json = JSON.stringify({ templates: [{ label: 'B', features: Array.from(features()) }] });

    await store.importJSON(json, 'merge');
    expect((await store.getAll()).map(t => t.label)).toEqual(['A', 'B']);
    await store.importJSON(json, 'replace');
    const all = await store.getAll();
    expect(all.map(t => t.label)).toEqual(['B']);
    expect(Number.isNaN(Date.parse(all[0].createdAt))).toBe(false);
  });

  it('descarta plantillas con forma incorrecta', async () => {
    const json = JSON.stringify({ templates: [
      saved('A'),
      { label: 'corta', features: [1, 2, 3] },
      { label: 'texto', features: new Array(63).fill('1') },
      { features: Array.from(features()) },
    ] });
    await expect(freshStore().importJSON(json)).resolves.toBe(1);
  });

  it.each([
    ['no es JSON', '{', 'JSON inválido'],
    ['sin templates', '{"otra":1}', 'falta el array "templates"'],
    ['sin plantillas válidas', '{"templates":[{"label":"x"}]}', 'No se encontraron plantillas válidas'],
  ])('rechaza un archivo %s', async (_name, json, message) => {
    await expect(freshStore().importJSON(json)).rejects.toThrow(message);
  });
});
