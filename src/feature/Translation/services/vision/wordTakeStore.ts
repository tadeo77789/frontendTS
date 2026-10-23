import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tomas de palabras grabadas en el admin que todavia no se subieron.
 *
 * Es una sala de espera: al subir se vacian, porque desde ese momento las
 * plantillas viven en el servidor. Cada toma son 30x128 numeros; se redondean
 * a 4 decimales para que unas cuantas palabras quepan en localStorage, que es
 * donde termina AsyncStorage en web.
 */

const STORAGE_KEY = '@traduce_senas/word_takes_v1';

export interface WordTake {
  label: string;
  frames: number[][];
  createdAt: string;
}

const round = (n: number): number => Math.round(n * 10_000) / 10_000;

const load = async (): Promise<WordTake[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { takes?: WordTake[] };
    return Array.isArray(parsed.takes) ? parsed.takes : [];
  } catch {
    return [];
  }
};

const save = (takes: WordTake[]): Promise<void> =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ takes }));

export const wordTakeStore = {
  getAll: load,

  async countByLabel(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const t of await load()) counts[t.label] = (counts[t.label] ?? 0) + 1;
    return counts;
  },

  async add(label: string, frames: ArrayLike<number>[]): Promise<void> {
    const takes = await load();
    takes.push({
      label: label.trim(),
      frames: frames.map(f => Array.from(f, round)),
      createdAt: new Date().toISOString(),
    });
    await save(takes);
  },

  async removeLabel(label: string): Promise<void> {
    await save((await load()).filter(t => t.label !== label));
  },

  clear: (): Promise<void> => AsyncStorage.removeItem(STORAGE_KEY),
};
