
import AsyncStorage from '@react-native-async-storage/async-storage';

// v2: las plantillas pasaron de 63 a 126 valores (dos manos). Las viejas
// no se pueden comparar con las nuevas, asi que se guardan aparte.
const STORAGE_KEY = '@traduce_senas/gesture_templates_v2';

export const SEQ_LEN = 16;

/** 126 = 2 manos x 21 puntos x (x, y, z). */
export const FRAME_DIM = 126;

export interface GestureTemplate {

  label: string;

  frames: number[][];

  createdAt: string;
}

interface GesturesPayload {
  gestures: GestureTemplate[];
}

let cache: GestureTemplate[] | null = null;
let loadPromise: Promise<GestureTemplate[]> | null = null;

// Si AsyncStorage falla al leer, lanza y no cachea nada: la siguiente llamada reintenta,
// y las escrituras no pisan lo guardado con una lista vacia. Un JSON corrupto si se
// descarta (cache vacia), porque no se puede recuperar.
const load = async (): Promise<GestureTemplate[]> => {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  const p = (async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    try {
      const parsed = raw ? (JSON.parse(raw) as GesturesPayload) : null;
      cache = parsed && Array.isArray(parsed.gestures) ? parsed.gestures : [];
    } catch {
      cache = [];
    }
    return cache;
  })();
  loadPromise = p;
  // Lectura fallida: se suelta la promesa para que la siguiente llamada reintente
  // (aunque getItem lance de forma sincrona, porque se limpia despues de asignarla).
  p.catch(() => {
    if (loadPromise === p) loadPromise = null;
  });

  return p;
};

// Para lecturas que no deben romper la pantalla (conteos, reconocimiento):
// si no se puede leer, devuelve una lista vacia sin cachearla.
const loadOrEmpty = async (): Promise<GestureTemplate[]> => {
  try {
    return await load();
  } catch {
    return [];
  }
};

const persist = async (): Promise<void> => {
  if (!cache) return;
  try {
    const payload: GesturesPayload = { gestures: cache };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {

  }
};

const isValidTemplate = (t: Partial<GestureTemplate>): t is GestureTemplate =>
  typeof t?.label === 'string' &&
  t.label.trim().length > 0 &&
  Array.isArray(t.frames) &&
  t.frames.length === SEQ_LEN &&
  t.frames.every(
    f => Array.isArray(f) && f.length === FRAME_DIM && f.every(n => typeof n === 'number'),
  );

export const gestureStore = {

  async getAll(): Promise<GestureTemplate[]> {
    return loadOrEmpty();
  },

  async countByLabel(): Promise<Record<string, number>> {
    const all = await loadOrEmpty();
    const counts: Record<string, number> = {};
    for (const g of all) {
      counts[g.label] = (counts[g.label] ?? 0) + 1;
    }
    return counts;
  },

  async add(label: string, frames: number[][]): Promise<void> {
    await load();
    if (!cache) cache = [];
    cache.push({ label: label.trim(), frames, createdAt: new Date().toISOString() });
    await persist();
  },

  async removeLabel(label: string): Promise<void> {
    await load();
    if (!cache) return;
    cache = cache.filter(g => g.label !== label);
    await persist();
  },

  async clear(): Promise<void> {
    // Espera una lectura en curso para que, al terminar, no devuelva lo borrado a la cache.
    await loadOrEmpty();
    cache = [];
    await persist();
  },

  async exportJSON(): Promise<string> {
    const all = await load();
    return JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), gestures: all },
      null,
      2,
    );
  },

  async importJSON(json: string, mode: 'merge' | 'replace' = 'merge'): Promise<number> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('JSON inválido');
    }
    const obj = parsed as { gestures?: unknown };
    if (!Array.isArray(obj.gestures)) {
      throw new Error('Formato no reconocido: falta el array "gestures"');
    }
    const incoming = (obj.gestures as Partial<GestureTemplate>[]).filter(isValidTemplate);
    if (incoming.length === 0) {
      throw new Error('No se encontraron gestos válidos en el archivo');
    }
    // Combinar necesita lo guardado y falla si no se puede leer. Reemplazar no lo necesita,
    // pero espera cualquier lectura en curso para que no pise lo importado al terminar.
    if (mode === 'merge') await load();
    else await loadOrEmpty();
    if (mode === 'replace' || !cache) {
      cache = incoming;
    } else {
      cache = [...cache, ...incoming];
    }
    await persist();
    return incoming.length;
  },
};
