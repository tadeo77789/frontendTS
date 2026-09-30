/**
 * Agente del modo "palabras": estabiliza la salida del GestureRecognizer y
 * persiste cada sena confirmada.
 *
 * El motor emite un resultado por frame (~30-60 fps). Sin estabilizacion eso
 * serian cientos de POST por segundo, asi que una sena solo se confirma
 * cuando se sostiene lo suficiente, y no se vuelve a enviar hasta que cambie
 * o pase el tiempo de espera.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { gestureEngine } from '../services/vision';
import type { GestureRecognition } from '../services/vision';
import { translationsService } from '../services/translations.service';

export interface UseGestureAgentOptions {
  /** Confianza minima para tener en cuenta un frame. */
  minScore?: number;
  /** Frames consecutivos con la misma sena antes de confirmar. */
  holdFrames?: number;
  /** Tiempo minimo sosteniendo la sena, en ms. */
  holdMs?: number;
  /** Espera antes de volver a enviar la MISMA sena, en ms. */
  repeatCooldownMs?: number;
  /** Guardar en el backend cada sena confirmada. */
  persist?: boolean;
}

export interface ConfirmedGesture {
  id: string;
  categoryName: string;
  word: string;
  score: number;
  at: number;
  /** false mientras el POST esta en vuelo o si fallo. */
  saved: boolean;
}

export type GestureAgentStatus = 'idle' | 'loading' | 'searching' | 'holding' | 'error';

export interface UseGestureAgentResult {
  isSupported: boolean;
  isRunning: boolean;
  status: GestureAgentStatus;
  error: string | null;
  saveError: string | null;
  /** Sena vista en este instante (aun sin confirmar). */
  liveWord: string;
  liveScore: number;
  /** Avance hacia la confirmacion, 0..1. Alimenta la barra de progreso. */
  holdProgress: number;
  confirmed: ConfirmedGesture[];
  lastConfirmed: ConfirmedGesture | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/** Refresco de la UI: 10 Hz basta y evita un setState por frame de camara. */
const UI_TICK_MS = 100;

export const useGestureAgent = (
  options: UseGestureAgentOptions = {},
): UseGestureAgentResult => {
  const {
    minScore = 0.7,
    holdFrames = 10,
    holdMs = 500,
    repeatCooldownMs = 2000,
    persist = true,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<GestureAgentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [liveWord, setLiveWord] = useState('');
  const [liveScore, setLiveScore] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmed, setConfirmed] = useState<ConfirmedGesture[]>([]);

  // Todo el conteo vive en refs: el callback del motor corre por frame y no
  // debe provocar renders.
  const candidateRef = useRef<GestureRecognition | null>(null);
  const frameCountRef = useRef(0);
  const firstSeenAtRef = useRef(0);
  const lastEmittedRef = useRef<{ word: string; at: number } | null>(null);
  const runningRef = useRef(false);

  const clearCandidate = useCallback(() => {
    candidateRef.current = null;
    frameCountRef.current = 0;
    firstSeenAtRef.current = 0;
  }, []);

  const persistGesture = useCallback(
    async (entry: ConfirmedGesture) => {
      if (!persist) return;
      try {
        await translationsService.save({
          inputText: entry.categoryName,
          outputText: entry.word,
          type: 'sena_texto',
          confidence: Number(entry.score.toFixed(3)),
          source: 'mediapipe',
        });
        setConfirmed(prev => prev.map(c => (c.id === entry.id ? { ...c, saved: true } : c)));
        setSaveError(null);
      } catch (err) {
        const isUnauthorized =
          (err as { response?: { status?: number } })?.response?.status === 401;
        setSaveError(
          isUnauthorized
            ? 'Sesion expirada: vuelve a iniciar sesion para guardar traducciones.'
            : 'No se pudo guardar la traduccion.',
        );
      }
    },
    [persist],
  );

  const confirmGesture = useCallback(
    (recognition: GestureRecognition, now: number) => {
      const entry: ConfirmedGesture = {
        id: `${now}-${recognition.categoryName}`,
        categoryName: recognition.categoryName,
        word: recognition.word,
        score: recognition.score,
        at: now,
        saved: false,
      };

      lastEmittedRef.current = { word: recognition.word, at: now };
      clearCandidate();
      setConfirmed(prev => [...prev, entry]);
      void persistGesture(entry);
    },
    [clearCandidate, persistGesture],
  );

  const handleFrame = useCallback(
    (result: GestureRecognition | null) => {
      if (!runningRef.current) return;

      const now = Date.now();

      if (!result || result.score < minScore) {
        clearCandidate();
        return;
      }

      if (candidateRef.current?.word === result.word) {
        frameCountRef.current += 1;
        candidateRef.current = result;
      } else {
        candidateRef.current = result;
        frameCountRef.current = 1;
        firstSeenAtRef.current = now;
      }

      const heldEnoughFrames = frameCountRef.current >= holdFrames;
      const heldLongEnough = now - firstSeenAtRef.current >= holdMs;
      if (!heldEnoughFrames || !heldLongEnough) return;

      // Anti-rebote: la misma sena no se reenvia hasta pasado el enfriamiento.
      const last = lastEmittedRef.current;
      if (last && last.word === result.word && now - last.at < repeatCooldownMs) return;

      confirmGesture(result, now);
    },
    [minScore, holdFrames, holdMs, repeatCooldownMs, clearCandidate, confirmGesture],
  );

  // Espeja los refs hacia el estado a 10 Hz.
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      const candidate = candidateRef.current;
      if (!candidate) {
        setLiveWord('');
        setLiveScore(0);
        setHoldProgress(0);
        setStatus(prev => (prev === 'error' || prev === 'loading' ? prev : 'searching'));
        return;
      }

      const byFrames = frameCountRef.current / holdFrames;
      const byTime = (Date.now() - firstSeenAtRef.current) / holdMs;
      setLiveWord(candidate.word);
      setLiveScore(candidate.score);
      setHoldProgress(Math.max(0, Math.min(1, Math.min(byFrames, byTime))));
      setStatus(prev => (prev === 'error' ? prev : 'holding'));
    }, UI_TICK_MS);

    return () => clearInterval(id);
  }, [isRunning, holdFrames, holdMs]);

  useEffect(() => {
    if (!isRunning) return;

    let cancelled = false;
    runningRef.current = true;
    setStatus('loading');
    setError(null);

    gestureEngine
      .start(handleFrame)
      .then(() => {
        if (!cancelled) setStatus('searching');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStatus('error');
        setError(err?.message || 'No se pudo cargar el modelo de gestos');
      });

    return () => {
      cancelled = true;
      runningRef.current = false;
      gestureEngine.stop();
    };
  }, [isRunning, handleFrame]);

  useEffect(() => () => gestureEngine.stop(), []);

  const start = useCallback(() => {
    clearCandidate();
    lastEmittedRef.current = null;
    setSaveError(null);
    setIsRunning(true);
  }, [clearCandidate]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    setStatus('idle');
    clearCandidate();
    setLiveWord('');
    setLiveScore(0);
    setHoldProgress(0);
  }, [clearCandidate]);

  const reset = useCallback(() => {
    setConfirmed([]);
    setSaveError(null);
    lastEmittedRef.current = null;
    clearCandidate();
  }, [clearCandidate]);

  return {
    isSupported: gestureEngine.isSupported,
    isRunning,
    status,
    error,
    saveError,
    liveWord,
    liveScore,
    holdProgress,
    confirmed,
    lastConfirmed: confirmed.length ? confirmed[confirmed.length - 1] : null,
    start,
    stop,
    reset,
  };
};
