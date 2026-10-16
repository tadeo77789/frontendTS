
import { TFJS_MODEL_URL } from '../../../../app/config/api.config';
import { mockProvider } from './mockProvider';
import { tfjsProvider } from './tfjsProvider';
import type { SignVisionProvider } from './types';

export const mediapipeProvider: SignVisionProvider = TFJS_MODEL_URL
  ? tfjsProvider
  : { ...mockProvider, name: 'native-fallback(mock)' };
