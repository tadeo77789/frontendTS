/**
 * Pagina embebida del motor de palabras, para el WebView de la app nativa.
 *
 * Se abre con `?embed=word-engine` (ver App.tsx). Pide la camara, corre el
 * mismo motor web que la pantalla de traduccion y le manda a la app cada
 * resultado por `window.ReactNativeWebView.postMessage`. No monta sesion,
 * navegacion ni tema: guardar cada sena lo hace la app con su propio token.
 *
 * El protocolo esta en `wordEngineTypes.ts`; el otro extremo es la version
 * nativa de `wordEngine.ts`.
 */

import React, { useEffect, useRef } from 'react';
import {
  activeEngineName,
  gestureEngine,
  isGenericGestureEngine,
  wordEnginePerf,
  wordPrediction,
  wordState,
  wordVocabulary,
} from '../services/vision/wordEngine';
import type { WordEngineCommand, WordEngineMessage } from '../services/vision/wordEngineTypes';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
    /** Por aqui entran las ordenes de la app (`injectJavaScript`). */
    __wordEngine?: { command: (cmd: WordEngineCommand) => void };
  }
}

/** Mismo ritmo con el que la pantalla consulta el estado del motor. */
const STATUS_MS = 200;

const post = (msg: WordEngineMessage): void => {
  window.ReactNativeWebView?.postMessage(JSON.stringify(msg));
};

export const isWordEngineEmbed = (): boolean =>
  new URLSearchParams(window.location.search).get('embed') === 'word-engine';

export const WordEngineEmbed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let statusTimer: ReturnType<typeof setInterval> | undefined;

    window.__wordEngine = {
      command: cmd => {
        if (cmd === 'reset') gestureEngine.reset?.();
      },
    };

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const video = videoRef.current;
        if (cancelled || !video) return;
        video.srcObject = stream;
        await video.play();

        // Los frames sin sena llegan seguidos: basta con avisar el primero.
        let lastWasNull = false;
        await gestureEngine.start(result => {
          if (!result && lastWasNull) return;
          lastWasNull = !result;
          post({ type: 'result', result });
        });
        if (cancelled) return;

        post({
          type: 'ready',
          engine: activeEngineName(),
          emitsCompleteSigns: !!gestureEngine.emitsCompleteSigns,
          generic: isGenericGestureEngine(),
        });

        // El modelo baja sus glosas despues de arrancar: se mandan cuando lleguen.
        let vocabularySent = false;
        statusTimer = setInterval(() => {
          if (!vocabularySent) {
            const words = wordVocabulary();
            if (words.length > 0) {
              vocabularySent = true;
              post({ type: 'vocabulary', words });
            }
          }
          post({ type: 'status', state: wordState(), perf: wordEnginePerf(), prediction: wordPrediction() });
        }, STATUS_MS);
      } catch (err) {
        post({ type: 'error', message: (err as Error)?.message || 'No se pudo iniciar la camara' });
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(statusTimer);
      gestureEngine.stop();
      stream?.getTracks().forEach(track => track.stop());
      delete window.__wordEngine;
    };
  }, []);

  // Espejo como en la app: la persona se ve igual que en un espejo. Es solo
  // CSS, el motor lee el video sin voltear.
  return (
    <video
      ref={videoRef}
      muted
      playsInline
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        background: '#000',
      }}
    />
  );
};
