import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../app/providers/AuthContext';
import { profileStatsService } from '../services/profileStats.service';
import type { MyStats } from '../data/achievements';

interface StatsSession {
  userId: number | null;
  token: string | null;
  generation: number;
}

interface StatsState {
  session: StatsSession;
  stats: MyStats | null;
  loading: boolean;
  error: boolean;
}

/** Carga las estadisticas del usuario cada vez que Perfil recibe el foco. */
export const useMyStats = () => {
  const {
    user,
    token,
    isAuthenticated,
    sessionGeneration,
    isSessionCurrent,
  } = useAuth();

  const userId = isAuthenticated ? user?.id_usuario ?? null : null;
  const sessionToken = userId === null ? null : token;
  const session = useMemo<StatsSession>(() => ({
    userId,
    token: sessionToken,
    generation: sessionGeneration,
  }), [userId, sessionToken, sessionGeneration]);

  const renderedSessionRef = useRef(session);
  renderedSessionRef.current = session;

  const focusedSessionRef = useRef<StatsSession | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<StatsState>({
    session,
    stats: null,
    loading: true,
    error: false,
  });

  // Invalida primero: ni errores ni finally de la consulta anterior son vigentes.
  const cancel = useCallback(() => {
    const controller = controllerRef.current;
    controllerRef.current = null;
    controller?.abort();
  }, []);

  // Limpia los datos aunque Perfil permanezca montado y sin foco.
  useEffect(() => {
    setState({
      session,
      stats: null,
      loading: session.userId !== null && session.token !== null,
      error: false,
    });
  }, [session]);

  const load = useCallback(async (): Promise<void> => {
    const { userId, token, generation } = session;

    // También descarta un reload conservado por un render de otra sesión.
    if (
      userId === null
      || token === null
      || focusedSessionRef.current !== session
      || renderedSessionRef.current !== session
      || !isSessionCurrent(generation)
    ) {
      return;
    }

    // Un reintento sustituye cualquier consulta pendiente.
    cancel();
    const controller = new AbortController();
    controllerRef.current = controller;

    const isCurrent = (): boolean =>
      controllerRef.current === controller
      && !controller.signal.aborted
      && focusedSessionRef.current === session
      && renderedSessionRef.current === session
      && isSessionCurrent(generation);

    setState(previous => ({
      session,
      stats: previous.session === session ? previous.stats : null,
      loading: true,
      error: false,
    }));

    try {
      const stats = await profileStatsService.getMine(
        token,
        controller.signal,
      );

      if (!isCurrent()) return;

      setState({
        session,
        stats,
        loading: true,
        error: false,
      });
    } catch {
      if (!isCurrent()) return;

      setState(previous => ({
        ...previous,
        error: true,
      }));
    } finally {
      if (isCurrent()) {
        controllerRef.current = null;
        setState(previous => ({
          ...previous,
          loading: false,
        }));
      }
    }
  }, [session, isSessionCurrent, cancel]);

  useFocusEffect(
    useCallback(() => {
      focusedSessionRef.current = session;
      void load();

      // Se ejecuta al perder foco, desmontarse o cambiar la sesión.
      return () => {
        focusedSessionRef.current = null;
        cancel();
      };
    }, [session, load, cancel])
  );

  // Evita mostrar datos de otra cuenta antes de que se ejecuten los efectos.
  const visible =
    state.session === session
    && isSessionCurrent(session.generation);

  return {
    stats: visible ? state.stats : null,
    loading: visible
      ? state.loading
      : session.userId !== null && session.token !== null,
    error: visible ? state.error : false,
    reload: load,
  };
};