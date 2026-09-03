
import { api, getCurrentUserId } from './api.service';
import { ENDPOINTS } from '../../../app/config/api.config';
import type { TipoTraduccion } from '../../../shared/types';

export interface SaveTranslationInput {
  inputText: string;
  outputText: string;
  type: TipoTraduccion;
  confidence?: number;
  source?: 'mediapipe' | 'knn' | 'mock' | 'manual' | 'motion' | 'geometric';
}

export interface SavedTranslation {
  translation_id: number;
  user_id: number | null;
  input_text: string;
  output_text: string;
  type: TipoTraduccion;
  confidence: number | null;
  source: string | null;
  is_deleted: boolean;
  created_at: string;
}

export const translationsService = {

  async save(input: SaveTranslationInput): Promise<SavedTranslation> {
    const userId = await getCurrentUserId();
    const { data } = await api.post(ENDPOINTS.translate, {
      ...input,
      user_id: userId,
    });
    return data?.data as SavedTranslation;
  },

  async list(opts: { limit?: number; offset?: number } = {}): Promise<SavedTranslation[]> {
    const userId = await getCurrentUserId();
    const { data } = await api.get(ENDPOINTS.history, {
      params: { user_id: userId, ...opts },
    });
    return (data?.data ?? []) as SavedTranslation[];
  },

  async remove(translationId: number): Promise<void> {
    const userId = await getCurrentUserId();
    await api.delete(ENDPOINTS.deleteTranslation(translationId), {
      params: { user_id: userId },
    });
  },
};
