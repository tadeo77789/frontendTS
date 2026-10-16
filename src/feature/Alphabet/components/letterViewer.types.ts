import type { StyleProp, ViewStyle } from 'react-native';
import { Asset } from 'expo-asset';

export interface LetterViewerProps {
  /** Modulo local (require del .glb) o URL remota del lexico. */
  model: number | string;
  letter: string;
  animated: boolean;
  dark: boolean;
  style?: StyleProp<ViewStyle>;
  onLoadStart?: () => void;
  onLoaded?: (info: { animated: boolean; duration: number }) => void;
  onAnimationEnd?: () => void;
  onError?: (message: string) => void;
}

export interface LetterViewerHandle {
  replay: () => void;
  resetView: () => void;
}

/** Devuelve una URI que el visor pueda descargar, sea el modelo local o remoto. */
export const resolveModelUri = async (model: number | string): Promise<string> => {
  if (typeof model === 'string') return model;
  const asset = Asset.fromModule(model);
  if (!asset.localUri) await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
};
