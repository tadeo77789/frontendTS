
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraView } from 'expo-camera';
import { signVisionProvider } from '../services/vision';
import type { SignDetectionResult, SignAgentStatus } from '../../../shared/types';

export interface UseSignAgentOptions {

  intervalMs?: number;

  minConfidence?: number;

  quality?: number;

  confirmFrames?: number;
}

export interface UseSignAgentResult {

  isRunning: boolean;

  status: SignAgentStatus;

  lastResult: SignDetectionResult | null;

  transcript: string;

  pendingLetter: string;

  pendingCount: number;

  confirmFrames: number;

  start: () => void;

  stop: () => void;

  reset: () => void;

  backspace: () => void;

  appendSpace: () => void;
}

const isCameraViewWithCapture = (
  ref: CameraView | null,
): ref is CameraView & {
  takePictureAsync: (opts?: {
    base64?: boolean;
    quality?: number;
    skipProcessing?: boolean;
  }) => Promise<{ base64?: string; width: number; height: number; uri: string }>;
} => !!ref && typeof (ref as unknown as { takePictureAsync?: unknown }).takePictureAsync === 'function';

export const useSignAgent = (
  cameraRef: React.RefObject<CameraView | null>,
  options: UseSignAgentOptions = {},
): UseSignAgentResult => {
  const {
    intervalMs = 1500,
    minConfidence = 0.7,
    quality = 0.4,
    confirmFrames = 2,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<SignAgentStatus>('idle');
  const [lastResult, setLastResult] = useState<SignDetectionResult | null>(null);
  const [transcript, setTranscript] = useState('');
  const [pendingLetter, setPendingLetter] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const lastAppendedRef = useRef<string>('');
  const pendingLetterRef = useRef<string>('');
  const pendingCountRef = useRef(0);
  const runningRef = useRef(false);

  const clearPending = useCallback(() => {
    pendingLetterRef.current = '';
    pendingCountRef.current = 0;
    setPendingLetter('');
    setPendingCount(0);
  }, []);

  const captureAndDetect = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const cam = cameraRef.current;
      const capturedAt = new Date().toISOString();

      let base64 = '';
      let width = 0;
      let height = 0;

      if (isCameraViewWithCapture(cam)) {
        try {
          const photo = await cam.takePictureAsync({
            base64: true,
            quality,
            skipProcessing: true,
          });
          base64 = photo?.base64 ?? '';
          width = photo?.width ?? 0;
          height = photo?.height ?? 0;
        } catch {

        }
      }

      if (!base64) {

        base64 = `synthetic-${capturedAt}-${Math.random().toString(36).slice(2, 10)}`;
      }

      const result = await signVisionProvider.detect({
        base64,
        width,
        height,
        capturedAt,
      });

      setLastResult(result);
      setStatus(result.status);

      if (result.status === 'no_hands') {
        lastAppendedRef.current = '';
        if (pendingLetterRef.current) clearPending();
        return;
      }

      const candidate = result.text;
      if (!candidate || result.confidence < minConfidence || result.status !== 'detecting') {

        return;
      }

      if (pendingLetterRef.current === candidate) {
        pendingCountRef.current += 1;
      } else {
        pendingLetterRef.current = candidate;
        pendingCountRef.current = 1;
      }
      setPendingLetter(pendingLetterRef.current);
      setPendingCount(pendingCountRef.current);

      const framesNeeded = result.source === 'motion' ? 1 : confirmFrames;

      if (
        pendingCountRef.current >= framesNeeded &&
        candidate !== lastAppendedRef.current
      ) {
        lastAppendedRef.current = candidate;
        setTranscript(prev => {
          if (!prev) return candidate;

          const isLetter = candidate.length === 1 || candidate === 'RR';
          return isLetter ? prev + candidate : `${prev} ${candidate}`;
        });
        clearPending();
      }
    } catch {
      setStatus('error');
    } finally {
      inFlightRef.current = false;
    }
  }, [cameraRef, minConfidence, quality, confirmFrames, clearPending]);

  useEffect(() => {
    if (!isRunning) return;

    let cancelled = false;
    runningRef.current = true;

    const tick = async () => {
      if (cancelled || !runningRef.current) return;
      await captureAndDetect();
      if (cancelled || !runningRef.current) return;
      timerRef.current = setTimeout(tick, intervalMs);
    };

    signVisionProvider.init?.().catch(() => undefined);

    timerRef.current = setTimeout(tick, 600);

    return () => {
      cancelled = true;
      runningRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, intervalMs, captureAndDetect]);

  useEffect(() => () => signVisionProvider.dispose?.(), []);

  const start = useCallback(() => {
    lastAppendedRef.current = '';
    clearPending();
    setStatus('starting');
    setIsRunning(true);
  }, [clearPending]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    setStatus('idle');
    clearPending();
  }, [clearPending]);

  const reset = useCallback(() => {
    setTranscript('');
    setLastResult(null);
    lastAppendedRef.current = '';
    clearPending();
  }, [clearPending]);

  const backspace = useCallback(() => {
    setTranscript(prev => prev.slice(0, -1));
    lastAppendedRef.current = '';
  }, []);

  const appendSpace = useCallback(() => {
    setTranscript(prev => (prev.endsWith(' ') || prev.length === 0 ? prev : prev + ' '));
    lastAppendedRef.current = '';
  }, []);

  return {
    isRunning,
    status,
    lastResult,
    transcript,
    pendingLetter,
    pendingCount,
    confirmFrames,
    start,
    stop,
    reset,
    backspace,
    appendSpace,
  };
};
