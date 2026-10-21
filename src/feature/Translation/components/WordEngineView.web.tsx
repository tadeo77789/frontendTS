/**
 * En web el motor lee directo el <video> de `CameraView`, asi que este puente
 * no hace falta. Existe para que Metro no meta react-native-webview en el
 * bundle web.
 */

import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export const WordEngineView: React.FC<{ style?: StyleProp<ViewStyle> }> = () => null;
