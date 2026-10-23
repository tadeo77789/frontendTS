import { borrarGlosa, contarPorGlosa } from '../sampleStore.web';

/**
 * IndexedDB minimo: solo lo que hace falta para que cada operacion falle y
 * comprobar que la promesa se rechaza con un Error aunque el navegador no
 * entregue el error (req.error null), que es lo que pasa en algunos fallos.
 */
type Handlers = { onsuccess?: () => void; onerror?: () => void; oncomplete?: () => void };

const failingRequest = (): Handlers & { error: null; result?: unknown } => {
  const req: Handlers & { error: null; result?: unknown } = { error: null };
  setTimeout(() => req.onerror?.());
  return req;
};

const fakeDb = (fail: 'request' | 'transaction') => ({
  close: jest.fn(),
  transaction: () => {
    const tx: Handlers & { error: null; objectStore: () => unknown } = {
      error: null,
      objectStore: () => ({
        getAll: () => failingRequest(),
        index: () => ({
          openCursor: () => {
            if (fail === 'transaction') setTimeout(() => tx.onerror?.());
            return {} as Handlers;
          },
        }),
      }),
    };
    return tx;
  },
});

const installIndexedDb = (open: () => unknown) => {
  (globalThis as { indexedDB?: unknown }).indexedDB = { open };
  (globalThis as { IDBKeyRange?: unknown }).IDBKeyRange = { only: (v: unknown) => v };
};

const openingWith = (db: unknown) => () => {
  const req: Handlers & { result?: unknown; onupgradeneeded?: () => void } = {};
  setTimeout(() => {
    req.result = db;
    req.onsuccess?.();
  });
  return req;
};

describe('sampleStore.web: errores de IndexedDB', () => {
  afterEach(() => {
    delete (globalThis as { indexedDB?: unknown }).indexedDB;
    delete (globalThis as { IDBKeyRange?: unknown }).IDBKeyRange;
  });

  it('si no se puede abrir la base, rechaza con un Error', async () => {
    installIndexedDb(() => failingRequest());
    await expect(contarPorGlosa()).rejects.toThrow('No se pudo abrir IndexedDB');
  });

  it('si falla una lectura, rechaza con un Error', async () => {
    installIndexedDb(openingWith(fakeDb('request')));
    await expect(contarPorGlosa()).rejects.toThrow('Fallo la operacion en IndexedDB');
  });

  it('si falla el borrado, rechaza con un Error', async () => {
    installIndexedDb(openingWith(fakeDb('transaction')));
    await expect(borrarGlosa('hola')).rejects.toThrow('Fallo el borrado en IndexedDB');
  });
});
