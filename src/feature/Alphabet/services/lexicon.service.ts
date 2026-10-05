import { api } from '../../../shared/services/api.client';
import { ENDPOINTS } from '../../../app/config/api.config';
import type { LanguageCode } from '../../../app/providers/LanguageContext';

export type LexiconResourceType = 'MODEL_3D' | 'IMAGE' | 'VIDEO' | 'GIF';

export interface LexiconResource {
  resourceId: number;
  type: LexiconResourceType;
  /** URL absoluta (la arma el lexicon-service). */
  url: string;
  mimeType: string | null;
  displayOrder: number;
  description: string | null;
}

export interface LexiconSign {
  lexiconId: number;
  code: string;
  word: string;
  meaning: string | null;
  type: 'LETTER' | 'WORD' | 'PHRASE';
  letter: string | null;
  language: string;
  category: string;
  description: string | null;
  /** El modelo 3D trae animacion (G, H, J, Ñ, S, Z). */
  animated: boolean;
  displayOrder: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  resources: LexiconResource[];
}

/** Letra lista para pintar: miniatura y modelo ya resueltos. */
export interface AlphabetLetter {
  letter: string;
  imageUrl: string;
  modelUrl: string | null;
  animated: boolean;
  description: string | null;
}

interface AlphabetResponse {
  success: boolean;
  data?: LexiconSign[];
}

// El backend solo acepta es/en en `lang`; con fr/pt no se manda y responde en espanol.
const uiLang = (language: LanguageCode): 'es' | 'en' | undefined =>
  language === 'es' || language === 'en' ? language : undefined;

const firstOf = (sign: LexiconSign, type: LexiconResourceType): string | null =>
  [...sign.resources]
    .filter((r) => r.type === type)
    .sort((a, b) => a.displayOrder - b.displayOrder)[0]?.url ?? null;

export const fetchAlphabet = async (language: LanguageCode): Promise<AlphabetLetter[]> => {
  const res = await api.get<AlphabetResponse>(ENDPOINTS.lexiconAlphabet, {
    params: { lang: uiLang(language) },
  });
  const signs = res.data?.data;
  if (!Array.isArray(signs) || signs.length === 0) throw new Error('Empty alphabet');
  return signs
    .filter((s) => s.letter)
    .map((s) => ({
      letter: s.letter as string,
      // Sin miniatura propia se usa la del modelo; si falta, queda vacia.
      imageUrl: firstOf(s, 'IMAGE') ?? '',
      modelUrl: firstOf(s, 'MODEL_3D'),
      animated: s.animated,
      description: s.description,
    }));
};
