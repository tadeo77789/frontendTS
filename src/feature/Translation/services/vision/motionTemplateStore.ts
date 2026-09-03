
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@traduce_senas/gesture_templates_v1';

export const SEQ_LEN = 16;

export const FRAME_DIM = 63;

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

const load = async (): Promise<GestureTemplate[]> => {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        cache = [];
        return cache;
      }
      const parsed = JSON.parse(raw) as GesturesPayload;
      cache = Array.isArray(parsed.gestures) ? parsed.gestures : [];
      return cache;
    } catch {
      cache = [];
      return cache;
    }
  })();

  return loadPromise;
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
    return load();
  },

  async countByLabel(): Promise<Record<string, number>> {
    const all = await load();
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
    await load();
    if (mode === 'replace' || !cache) {
      cache = incoming;
    } else {
      cache = [...cache, ...incoming];
    }
    await persist();
    return incoming.length;
  },
};
