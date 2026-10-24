
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@traduce_senas/sign_templates_v1';

export interface SignTemplate {

  label: string;

  features: number[];

  createdAt: string;
}

interface TemplatesPayload {
  templates: SignTemplate[];
}

let cache: SignTemplate[] | null = null;
let loadPromise: Promise<SignTemplate[]> | null = null;

// Si AsyncStorage falla al leer, lanza y no cachea nada: la siguiente llamada reintenta,
// y las escrituras no pisan lo guardado con una lista vacia. Un JSON corrupto si se
// descarta (cache vacia), porque no se puede recuperar. Igual que motionTemplateStore.
const load = async (): Promise<SignTemplate[]> => {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  const p = (async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    try {
      const parsed = raw ? (JSON.parse(raw) as TemplatesPayload) : null;
      cache = parsed && Array.isArray(parsed.templates) ? parsed.templates : [];
    } catch {
      cache = [];
    }
    return cache;
  })();
  loadPromise = p;
  p.catch(() => {
    if (loadPromise === p) loadPromise = null;
  });

  return p;
};

// Para lecturas que no deben romper la pantalla (conteos, reconocimiento):
// si no se puede leer, devuelve una lista vacia sin cachearla.
const loadOrEmpty = async (): Promise<SignTemplate[]> => {
  try {
    return await load();
  } catch {
    return [];
  }
};

const persist = async (): Promise<void> => {
  if (!cache) return;
  try {
    const payload: TemplatesPayload = { templates: cache };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {

  }
};

export const templateStore = {

  async getAll(): Promise<SignTemplate[]> {
    return loadOrEmpty();
  },

  async countByLabel(): Promise<Record<string, number>> {
    const all = await loadOrEmpty();
    const counts: Record<string, number> = {};
    for (const tpl of all) {
      counts[tpl.label] = (counts[tpl.label] ?? 0) + 1;
    }
    return counts;
  },

  async add(label: string, features: Float32Array): Promise<void> {
    await load();
    if (!cache) cache = [];
    cache.push({
      label,
      features: Array.from(features),
      createdAt: new Date().toISOString(),
    });
    await persist();
  },

  async removeLabel(label: string): Promise<void> {
    await load();
    if (!cache) return;
    cache = cache.filter(t => t.label !== label);
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
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: all,
    };
    return JSON.stringify(payload, null, 2);
  },

  async importJSON(json: string, mode: 'merge' | 'replace' = 'merge'): Promise<number> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('JSON inválido');
    }

    const obj = parsed as { templates?: unknown };
    if (!Array.isArray(obj.templates)) {
      throw new Error('Formato no reconocido: falta el array "templates"');
    }

    const incoming: SignTemplate[] = [];
    for (const raw of obj.templates) {
      const t = raw as Partial<SignTemplate>;
      if (
        typeof t?.label === 'string' &&
        Array.isArray(t.features) &&
        t.features.length === 63 &&
        t.features.every((n: unknown) => typeof n === 'number')
      ) {
        incoming.push({
          label: t.label,
          features: t.features as number[],
          createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
        });
      }
    }

    if (incoming.length === 0) {
      throw new Error('No se encontraron plantillas válidas en el archivo');
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
