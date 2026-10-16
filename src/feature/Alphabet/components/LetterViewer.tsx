/**
 * Visor 3D de una letra en Android/iOS: la pagina del visor va en un WebView.
 *
 * El .glb no se pasa como ruta file:// (el WebView de cada plataforma tiene
 * reglas distintas para leer archivos locales) sino como data URI en base64:
 * pesa entre 500 y 780 KB y cruza el puente sin problemas.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { buildViewerHtml, VIEWER_SOURCE, type ViewerInbound, type ViewerOutbound } from './letterViewerHtml';
import { resolveModelUri, type LetterViewerHandle, type LetterViewerProps } from './letterViewer.types';

export type { LetterViewerHandle } from './letterViewer.types';

const toLoadableUrl = async (uri: string): Promise<string> => {
  if (!uri.startsWith('file:')) return uri;
  const b64 = await readAsStringAsync(uri, { encoding: 'base64' });
  return `data:model/gltf-binary;base64,${b64}`;
};

export const LetterViewer = forwardRef<LetterViewerHandle, LetterViewerProps>(function LetterViewer(
  { model, letter, animated, dark, style, onLoadStart, onLoaded, onAnimationEnd, onError },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const ready = useRef(false);
  const pending = useRef<ViewerInbound | null>(null);
  const html = useMemo(() => buildViewerHtml(dark), []); // eslint-disable-line react-hooks/exhaustive-deps

  const callbacks = useRef({ onLoadStart, onLoaded, onAnimationEnd, onError });
  callbacks.current = { onLoadStart, onLoaded, onAnimationEnd, onError };

  const post = useCallback((msg: ViewerInbound) => {
    if (!ready.current || !webRef.current) {
      if (msg.type === 'LOAD') pending.current = msg;
      return;
    }
    webRef.current.postMessage(JSON.stringify(msg));
  }, []);

  useImperativeHandle(ref, () => ({
    replay: () => post({ type: 'REPLAY' }),
    resetView: () => post({ type: 'RESET_VIEW' }),
  }), [post]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: ViewerOutbound;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg?.source !== VIEWER_SOURCE) return;

    if (msg.type === 'READY') {
      ready.current = true;
      if (pending.current) {
        const next = pending.current;
        pending.current = null;
        post(next);
      }
    } else if (msg.type === 'LOADED') {
      callbacks.current.onLoaded?.({ animated: msg.animated, duration: msg.duration });
    } else if (msg.type === 'ANIMATION_END') {
      callbacks.current.onAnimationEnd?.();
    } else if (msg.type === 'ERROR') {
      callbacks.current.onError?.(msg.message);
    }
  }, [post]);

  useEffect(() => {
    let alive = true;
    callbacks.current.onLoadStart?.();
    resolveModelUri(model)
      .then(toLoadableUrl)
      .then(url => alive && post({ type: 'LOAD', url, letter, animated }))
      .catch(err => alive && callbacks.current.onError?.(String(err?.message ?? err)));
    return () => { alive = false; };
  }, [model, letter, animated, post]);

  useEffect(() => { post({ type: 'THEME', dark }); }, [dark, post]);

  return (
    <View style={[styles.box, style]}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.webview}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
        accessibilityLabel={`Seña de la letra ${letter} en 3D`}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  box: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
