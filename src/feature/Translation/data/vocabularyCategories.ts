/**
 * Agrupa las señas disponibles por tema para mostrarlas ordenadas.
 *
 * Las palabras del modelo llegan en orden alfabetico (glosas.json). Aqui se
 * reparten en categorias fijas; lo que no este en ninguna cae en "Otros", asi
 * que reentrenar con palabras nuevas no rompe nada. Las palabras grabadas desde
 * el admin (plantillas del servidor) que el modelo no trae van en "Añadidos".
 */
import type { TranslationKey } from '../../../app/config/i18n';

export type VocabularyCategoryKey =
  | 'greetings'
  | 'courtesy'
  | 'feelings'
  | 'answers'
  | 'colors'
  | 'numbers'
  | 'actions'
  | 'others'
  | 'added';

export interface VocabularyGroup {
  key: VocabularyCategoryKey;
  labelKey: TranslationKey;
  words: string[];
}

interface CategoryDefinition {
  key: VocabularyCategoryKey;
  labelKey: TranslationKey;
  /** Orden en que se muestran; los numeros van en orden numerico, no alfabetico. */
  words: string[];
}

const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'greetings',
    labelKey: 'vocabCatGreetings',
    words: ['hola', 'bienvenido', 'buenos dias', 'buenas tardes', 'buenas noches', 'como esta', 'chao'],
  },
  {
    key: 'courtesy',
    labelKey: 'vocabCatCourtesy',
    words: ['por favor', 'gracias', 'muchas gracias', 'denada', 'con gusto', 'permiso', 'perdon', 'lo siento'],
  },
  {
    key: 'feelings',
    labelKey: 'vocabCatFeelings',
    words: ['bien', 'muy bien', 'excelente', 'perfecto', 'tranquilo', 'maso menos', 'mal', 'muy mal'],
  },
  { key: 'answers', labelKey: 'vocabCatAnswers', words: ['si', 'no'] },
  {
    key: 'colors',
    labelKey: 'vocabCatColors',
    words: ['amarillo', 'azul', 'blanco', 'gris', 'morado', 'naranja', 'negro', 'rojo', 'rosado', 'verde'],
  },
  {
    key: 'numbers',
    labelKey: 'vocabCatNumbers',
    words: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'dies'],
  },
  {
    key: 'actions',
    labelKey: 'vocabCatActions',
    words: ['apoyar', 'ayudar', 'esperar', 'invitar', 'necesitar', 'presentar', 'sentarse'],
  },
];

/** Compara sin tildes ni mayusculas: "Baño", "bano" y "baño" son la misma palabra. */
const normalize = (word: string): string =>
  word.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const byAlpha = (a: string, b: string) => a.localeCompare(b, 'es');

/**
 * @param modelWords palabras que reconoce el modelo (glosas.json)
 * @param addedWords etiquetas de las plantillas grabadas en el admin
 * @returns solo los grupos con al menos una palabra, en orden de muestra
 */
export const groupVocabulary = (modelWords: string[], addedWords: string[] = []): VocabularyGroup[] => {
  const pending = new Map(modelWords.map(w => [normalize(w), w]));

  const groups: VocabularyGroup[] = CATEGORIES.map(cat => {
    const words: string[] = [];
    for (const w of cat.words) {
      const found = pending.get(normalize(w));
      if (found !== undefined) {
        words.push(found);
        pending.delete(normalize(w));
      }
    }
    return { key: cat.key, labelKey: cat.labelKey, words };
  });

  groups.push({ key: 'others', labelKey: 'vocabCatOthers', words: [...pending.values()].sort(byAlpha) });

  const known = new Set(modelWords.map(normalize));
  const added = new Map<string, string>();
  for (const w of addedWords) {
    const n = normalize(w);
    if (n && !known.has(n) && !added.has(n)) added.set(n, w.trim());
  }
  groups.push({ key: 'added', labelKey: 'vocabCatAdded', words: [...added.values()].sort(byAlpha) });

  return groups.filter(g => g.words.length > 0);
};
