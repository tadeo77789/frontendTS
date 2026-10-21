/**
 * Camara del modo "palabras" en Android/iOS.
 *
 * Abre en un WebView la web en modo embebido (`?embed=word-engine`), que es
 * la que pide la camara y corre MediaPipe con el modelo LSC. Por eso, en este
 * modo, la pantalla no monta `CameraView`: dos consumidores de la camara a la
 * vez fallan en Android.
 *
 * Los mensajes de la pagina los interpreta la version nativa de `wordEngine.ts`.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { WEB_APP_URL, WORD_ENGINE_EMBED_URL } from '../../../app/config/api.config';
import {
  connectWordEngineView,
  failWordEngine,
  handleWordEngineMessage,
} from '../services/vision/wordEngine';

interface WordEngineViewProps {
  style?: StyleProp<ViewStyle>;
}

export const WordEngineView: React.FC<WordEngineViewProps> = ({ style }) => {
  const webRef = useRef<WebView>(null);

  useEffect(
    () =>
      connectWordEngineView(cmd => {
        webRef.current?.injectJavaScript(
          `window.__wordEngine && window.__wordEngine.command(${JSON.stringify(cmd)}); true;`,
        );
      }),
    [],
  );

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    handleWordEngineMessage(e.nativeEvent.data);
  }, []);

  return (
    <View style={[styles.box, style]}>
      <WebView
        ref={webRef}
        source={{ uri: WORD_ENGINE_EMBED_URL }}
        style={styles.webview}
        onMessage={onMessage}
        // Cualquier enlace fuera de la web propia se abre en el navegador.
        originWhitelist={[WEB_APP_URL]}
        javaScriptEnabled
        // iOS: concede la camara sin un segundo aviso; el permiso del sistema
        // ya lo pidio la pantalla. Android lo concede solo si la app lo tiene.
        mediaCapturePermissionGrantType="grant"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onError={e => failWordEngine(`No se pudo abrir el motor: ${e.nativeEvent.description}`)}
        onHttpError={e => failWordEngine(`El motor respondio ${e.nativeEvent.statusCode}`)}
        onRenderProcessGone={() => failWordEngine('El motor se cerro inesperadamente')}
        onContentProcessDidTerminate={() => failWordEngine('El motor se cerro inesperadamente')}
        accessibilityLabel="Camara de traduccion de senas"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
});
