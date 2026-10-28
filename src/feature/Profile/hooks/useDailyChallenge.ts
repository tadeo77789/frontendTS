import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../app/providers/AuthContext';
import { useAccess } from '../../../app/providers/AccessContext';
import { useLanguage } from '../../../app/providers/LanguageContext';
import { translationSaved } from '../../../shared/services/translationSaved';
import { DailyChallenge, dailyChallengeService } from '../services/dailyChallenge.service';

export const bogotaDay = (now: number) => new Date(now - 5 * 3600000).toISOString().slice(0, 10);
export const untilBogotaMidnight = (now: number) => Date.parse(`${bogotaDay(now)}T00:00:00-05:00`) + 86400000 - now;

export function useDailyChallenge() {
  const { user, token, isAuthenticated, sessionGeneration, isSessionCurrent } = useAuth();
  const access = useAccess();
  const { language } = useLanguage();
  const enabled = isAuthenticated && !!user && !!token && !access.isLoading && !access.error && !access.permissions.includes('users.manage');
  const session = useMemo(() => ({ userId: user?.id_usuario, token, generation: sessionGeneration, enabled }),
    [user?.id_usuario, token, sessionGeneration, enabled, language]);
  const rendered = useRef(session); rendered.current = session;
  const refreshRef = useRef<() => void>(() => undefined);
  const [state, setState] = useState<{ session: typeof session; data: DailyChallenge | null; loading: boolean; error: boolean }>({
    session, data: null, loading: enabled, error: false,
  });
  useFocusEffect(useCallback(() => {
    let alive = true;
    let controller: AbortController | undefined;
    let retries: ReturnType<typeof setTimeout>[] = [];
    let midnight: ReturnType<typeof setTimeout>;
    const current = () => alive && rendered.current === session && session.enabled && isSessionCurrent(session.generation);
    const cancel = () => { controller?.abort(); retries.forEach(clearTimeout); retries = []; };
    const load = async () => {
      if (!current() || !session.token) return;
      controller?.abort();
      const request = new AbortController(); controller = request;
      const valid = () => current() && controller === request && !request.signal.aborted;
      setState(old => ({ session, data: old.session === session ? old.data : null, loading: true, error: false }));
      try {
        const data = await dailyChallengeService.today(session.token, request.signal);
        if (valid()) setState({ session, data, loading: false, error: false });
      } catch {
        if (valid()) setState(old => ({ ...old, loading: false, error: true }));
      }
    };
    const refresh = () => { cancel(); void load(); };
    refreshRef.current = refresh;
    const onSaved = translationSaved.subscribe(event => {
      if (!current() || event.token !== session.token || event.userId !== session.userId) return;
      cancel();
      // Ventana acotada y reiniciable: RabbitMQ puede entregar después del HTTP de guardado.
      retries = [800, 2500, 6000, 12000].map(ms => setTimeout(() => { void load(); }, ms));
    });
    const armMidnight = () => {
      midnight = setTimeout(() => {
        if (!current()) return;
        // Oculta el reto anterior al cambiar el día, incluso si falla la red.
        setState({ session, data: null, loading: true, error: false });
        refresh(); armMidnight();
      }, untilBogotaMidnight(Date.now()) + 30);
    };
    const resume = () => {
      if (AppState.currentState === 'active' && (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState === 'visible')) refresh();
    };
    const subscription = AppState.addEventListener('change', resume);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', resume);
      window.addEventListener('focus', resume);
    }
    if (session.enabled) { refresh(); armMidnight(); }
    return () => {
      alive = false; cancel(); clearTimeout(midnight); onSaved(); subscription.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume);
      }
    };
  }, [session, isSessionCurrent]));
  const visible = enabled && state.session === session && isSessionCurrent(session.generation);
  // Si la app estuvo suspendida durante medianoche, no presenta datos del día anterior.
  const data = visible && state.data?.date === bogotaDay(Date.now()) ? state.data : null;
  return { enabled, data, loading: visible ? state.loading : enabled, error: visible && state.error,
    retry: () => { if (rendered.current === session) refreshRef.current(); } };
}
