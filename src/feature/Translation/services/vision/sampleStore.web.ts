/**
 * Guarda las repeticiones que graba la persona para reajustar el modelo.
 *
 * Va en IndexedDB y no en AsyncStorage por tamaño: cada muestra son 30x128
 * numeros en coma flotante, 15 KB. Diez repeticiones de 54 señas son 8 MB en
 * binario y pasan de 30 en JSON, muy por encima de lo que aguanta
 * localStorage, que es donde AsyncStorage termina en web. IndexedDB ademas
 * guarda el Float32Array tal cual, sin convertirlo a texto.
 *
 * Por que grabar estas muestras: el modelo aprendio de 25 personas grabadas
 * en un estudio, con una camara, una distancia y una luz concretas. Frente a
 * otra camara acierta mucho menos aunque la seña este bien hecha. Unas pocas
 * repeticiones propias enseñan justo lo que falta.
 */

import { SEQ_LEN, FEATURE_DIM } from './featureBuilder';

const DB = 'traduce_senas_muestras';
const STORE = 'muestras';
const VERSION = 1;

export interface Muestra {
  id?: number;
  glosa: string;
  /** SEQ_LEN * FEATURE_DIM valores, en el mismo orden que usa el modelo. */
  datos: Float32Array;
  creado: string;
}

const abrir = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('glosa', 'glosa', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const conStore = async <T>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await abrir();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, modo);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
};

export const guardarMuestra = async (glosa: string, datos: Float32Array): Promise<void> => {
  if (datos.length !== SEQ_LEN * FEATURE_DIM) {
    throw new Error(`Una muestra debe tener ${SEQ_LEN * FEATURE_DIM} valores, llegaron ${datos.length}`);
  }
  await conStore('readwrite', store =>
    store.add({ glosa, datos, creado: new Date().toISOString() } as Muestra),
  );
};

export const contarPorGlosa = async (): Promise<Record<string, number>> => {
  const todas = await conStore<Muestra[]>('readonly', store => store.getAll());
  const cuenta: Record<string, number> = {};
  for (const m of todas) cuenta[m.glosa] = (cuenta[m.glosa] ?? 0) + 1;
  return cuenta;
};

export const borrarGlosa = async (glosa: string): Promise<void> => {
  const db = await abrir();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const indice = tx.objectStore(STORE).index('glosa');
    const req = indice.openCursor(IDBKeyRange.only(glosa));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const borrarTodo = async (): Promise<void> => {
  await conStore('readwrite', store => store.clear());
};

/**
 * Empaqueta todo lo grabado para llevarlo al reentrenamiento.
 *
 * Salen dos archivos y no uno porque en JSON cada numero ocuparia unos ocho
 * caracteres: 8 MB de datos se convertirian en mas de 30. El `.bin` lleva los
 * numeros en crudo y el `.json` dice que hay dentro.
 */
export const exportar = async (): Promise<{ indice: string; datos: Blob } | null> => {
  const todas = await conStore<Muestra[]>('readonly', store => store.getAll());
  if (todas.length === 0) return null;

  const porMuestra = SEQ_LEN * FEATURE_DIM;
  const todo = new Float32Array(todas.length * porMuestra);
  todas.forEach((m, i) => todo.set(m.datos, i * porMuestra));

  const indice = {
    forma: [todas.length, SEQ_LEN, FEATURE_DIM],
    glosas: todas.map(m => m.glosa),
    creado: new Date().toISOString(),
    nota: 'Grabado desde la app; mismo formato que el entrenamiento (ver docs/06-data/model-input-format.md)',
  };

  return {
    indice: JSON.stringify(indice, null, 2),
    datos: new Blob([todo.buffer], { type: 'application/octet-stream' }),
  };
};

/** Lanza la descarga de los dos archivos desde el navegador. */
export const descargar = async (): Promise<number> => {
  const paquete = await exportar();
  if (!paquete) return 0;

  const bajar = (contenido: Blob, nombre: string) => {
    const url = URL.createObjectURL(contenido);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  bajar(new Blob([paquete.indice], { type: 'application/json' }), 'mis_muestras.json');
  bajar(paquete.datos, 'mis_muestras.bin');

  return JSON.parse(paquete.indice).glosas.length as number;
};
