import type { SavedTranslation } from '../../Translation/services/translations.service';

/** Tiempo maximo entre dos palabras para que cuenten como la misma sesion. */
export const SESSION_GAP_MS = 2 * 60 * 1000;

export interface HistoryWord {
  id: number;
  word: string;
  confidence: number | null;
}

export interface HistoryGroup {
  /** Id de la fila mas reciente del grupo. */
  key: string;
  ids: number[];
  type: SavedTranslation['type'];
  /** Palabras en el orden en que se dijeron. */
  words: HistoryWord[];
  phrase: string;
  start: Date;
  end: Date;
}

// Solo se agrupa lo que sale de la camara (sena -> texto). Hay palabras del
// modelo con espacio ("lo siento"), asi que no se distingue por el texto: si
// una frase del Abecedario cae entre palabras, entra en la misma sesion.
const isCameraRow = (row: SavedTranslation): boolean => row.type === 'sena_texto';

/**
 * Junta en una sesion las palabras seguidas que se dijeron con menos de
 * `gapMs` entre ellas. Es una aproximacion mientras el backend no guarde el
 * id de sesion: dos sesiones muy seguidas pueden quedar juntas.
 * Recibe las filas como las da la API (la mas reciente primero) y devuelve
 * los grupos en ese mismo orden.
 */
export function groupHistory(rows: SavedTranslation[], gapMs = SESSION_GAP_MS): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  let current: HistoryGroup | null = null;
  let currentIsCamera = false;

  for (const row of rows) {
    const at = new Date(row.createdAt);
    const word: HistoryWord = { id: row.translationId, word: (row.outputText ?? '').trim(), confidence: row.confidence };
    const camera = isCameraRow(row);

    if (current && currentIsCamera && camera && current.start.getTime() - at.getTime() <= gapMs) {
      current.ids.push(row.translationId);
      current.words.unshift(word);
      current.phrase = `${word.word} ${current.phrase}`;
      current.start = at;
      continue;
    }

    current = {
      key: String(row.translationId),
      ids: [row.translationId],
      type: row.type,
      words: [word],
      // Lo de la camara muestra el texto reconocido; el resto, el texto de entrada
      // como antes. Una fila sin texto deja una cadena vacia, no tumba la pantalla.
      phrase: camera ? word.word : (row.inputText ?? ''),
      start: at,
      end: at,
    };
    currentIsCamera = camera;
    groups.push(current);
  }
  return groups;
}
