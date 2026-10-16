/**
 * Visor 3D de una letra en web: la pagina del visor va en un <iframe srcDoc>.
 *
 * react-native-webview no funciona en web (pinta "does not support this
 * platform"), por eso esta variante. El iframe hereda el origen de la app, asi
 * que puede bajar los .glb que sirve Metro o el backend sin problemas de CORS.
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { buildViewerHtml, VIEWER_SOURCE, type ViewerInbound, type ViewerOutbound } from './letterViewerHtml';
import { resolveModelUri, type LetterViewerHandle, type LetterViewerProps } from './letterViewer.types';

export type { LetterViewerHandle } from './letterViewer.types';

export const LetterViewer = forwardRef<LetterViewerHandle, LetterViewerProps>(function LetterViewer(
  { model, letter, animated, dark, style, onLoadStart, onLoaded, onAnimationEnd, onError },
  ref,
) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const pending = useRef<ViewerInbound | null>(null);
  // El HTML se arma una sola vez: cambiar srcDoc recargaria three.js entero.
  // El tema posterior se manda por mensaje.
  const html = useMemo(() => buildViewerHtml(dark), []); // eslint-disable-line react-hooks/exhaustive-deps

  const callbacks = useRef({ onLoadStart, onLoaded, onAnimationEnd, onError });
  callbacks.current = { onLoadStart, onLoaded, onAnimationEnd, onError };

  const post = useCallback((msg: ViewerInbound) => {
    const win = frameRef.current?.contentWindow;
    if (!ready.current || !win) {
      if (msg.type === 'LOAD') pending.current = msg;
      return;
    }
    win.postMessage(JSON.stringify(msg), '*');
  }, []);

  useImperativeHandle(ref, () => ({
    replay: () => post({ type: 'REPLAY' }),
    resetView: () => post({ type: 'RESET_VIEW' }),
  }), [post]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      let msg: ViewerOutbound;
      try { msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
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
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  useEffect(() => {
    let alive = true;
    callbacks.current.onLoadStart?.();
    resolveModelUri(model)
      .then(uri => {
        if (!alive) return;
        // En web Metro entrega rutas relativas; el iframe srcDoc resuelve contra
        // about:srcdoc, asi que se pasa la URL absoluta.
        const url = new URL(uri, window.location.href).href;
        post({ type: 'LOAD', url, letter, animated });
      })
      .catch(err => alive && callbacks.current.onError?.(String(err?.message ?? err)));
    return () => { alive = false; };
  }, [model, letter, animated, post]);

  useEffect(() => { post({ type: 'THEME', dark }); }, [dark, post]);

  return (
    <View style={[styles.box, style]}>
      {React.createElement('iframe', {
        ref: frameRef,
        srcDoc: html,
        title: `Seña de la letra ${letter} en 3D`,
        style: { border: 0, width: '100%', height: '100%', display: 'block', background: 'transparent' },
        allow: 'autoplay',
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { flex: 1, overflow: 'hidden' },
});
