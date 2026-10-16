/**
 * Cliente del dominio lexicon del backend (`/api/lexicon`).
 */
import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import { LOCAL_ALPHABET, localLetterByCode, type AlphabetLetter } from '../data/alphabet';

export type SignType = 'LETTER' | 'WORD' | 'PHRASE';
export type ResourceType = 'MODEL_3D' | 'IMAGE' | 'VIDEO' | 'GIF';

export interface LexiconResource {
  resourceId: number;
  type: ResourceType;
  /** URL absoluta: el backend ya le antepone /api/lexicon/media. */
  url: string;
  mimeType: string | null;
  displayOrder: number;
  description: string | null;
}

export interface LexiconSign {
  lexiconId: number;
  code: string;
  word: string;
  type: SignType;
  letter: string | null;
  language: string;
  category: string | null;
  description: string | null;
  animated: boolean;
  displayOrder: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  resources: LexiconResource[];
}

interface ApiList<T> { success: boolean; data: T[] }
interface ApiOne<T> { success: boolean; data: T }

export const listSigns = async (params: { type?: SignType; q?: string; category?: string } = {}) => {
  const { data } = await api.get<ApiList<LexiconSign>>(ENDPOINTS.lexicon, { params });
  return data.data ?? [];
};

export const searchSigns = async (q: string) => {
  const { data } = await api.get<ApiList<LexiconSign>>(ENDPOINTS.lexiconSearch, { params: { q } });
  return data.data ?? [];
};

export const getSign = async (code: string) => {
  const { data } = await api.get<ApiOne<LexiconSign>>(`${ENDPOINTS.lexicon}/${encodeURIComponent(code)}`);
  return data.data;
};

const resourceUrl = (sign: LexiconSign, type: ResourceType) =>
  sign.resources.find(r => r.type === type)?.url;

/**
 * Une el alfabeto del servidor con los recursos empaquetados.
 *
 * El servidor manda en el texto, el orden y que letras estan activas. Para
 * los medios se prefiere la copia local (carga al instante y sin red); la
 * URL remota solo se usa para letras que la app aun no trae.
 */
export const mergeAlphabet = (remote: LexiconSign[]): AlphabetLetter[] => {
  const merged = remote
    .filter(s => s.type === 'LETTER' && s.letter)
    .map((s): AlphabetLetter | null => {
      const local = localLetterByCode(s.code);
      const model = local?.model ?? resourceUrl(s, 'MODEL_3D');
      const thumbUrl = resourceUrl(s, 'IMAGE');
      const thumb = local?.thumb ?? (thumbUrl ? { uri: thumbUrl } : undefined);
      if (!model || !thumb) return null;
      return {
        code: s.code,
        letter: s.letter as string,
        file: local?.file ?? s.code.replace(/^LETTER_/, ''),
        animated: s.animated,
        description: s.description ?? local?.description ?? '',
        thumb,
        model,
      };
    })
    .filter((l): l is AlphabetLetter => l !== null);

  return merged.length ? merged : LOCAL_ALPHABET;
};

export const fetchAlphabet = async (): Promise<AlphabetLetter[]> => {
  const { data } = await api.get<ApiList<LexiconSign>>(ENDPOINTS.lexiconAlphabet);
  return mergeAlphabet(data.data ?? []);
};
