import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../app/providers/AuthContext';
import { profileAchievementsService } from '../services/profileAchievements.service';
import type { PersistedAchievementProgress } from '../data/persistedAchievements';

interface AchievementsSession {
  userId: number | null;
  token: string | null;
  generation: number;
}

interface AchievementsState {
  session: AchievementsSession;
  achievements: PersistedAchievementProgress[] | null;
  loading: boolean;
  error: boolean;
}

/**
 * Carga los logros persistidos al recibir foco. enabled=false bloquea también
 * reload, oculta datos/errores y cancela la petición. Cada cambio de enabled
 * renueva la identidad de consulta para descartar respuestas tardías, incluso
 * si el transporte ignora la cancelación o se vuelve a habilitar enseguida.
 */
export const useMyAchievements = (enabled = true) => {
  const {
    user,
    token,
    isAuthenticated,
    sessionGeneration,
    isSessionCurrent,
  } = useAuth();

  const userId = isAuthenticated ? user?.id_usuario ?? null : null;
  const sessionToken = userId === null ? null : token;
  const session = useMemo<AchievementsSession>(() => ({
    userId,
    token: sessionToken,
    generation: sessionGeneration,
  }), [userId, sessionToken, sessionGeneration, enabled]);

  const renderedSessionRef = useRef(session);
  renderedSessionRef.current = session;

  const focusedSessionRef = useRef<AchievementsSession | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<AchievementsState>({
    session,
    achievements: null,
    loading: enabled,
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
      achievements: null,
      loading: enabled && session.userId !== null && session.token !== null,
      error: false,
    });
  }, [session, enabled]);

  const load = useCallback(async (): Promise<void> => {
    const { userId, token, generation } = session;

    // También descarta un reload conservado por un render de otra sesión.
    if (
      !enabled
      || userId === null
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
      enabled
      && controllerRef.current === controller
      && !controller.signal.aborted
      && focusedSessionRef.current === session
      && renderedSessionRef.current === session
      && isSessionCurrent(generation);

    setState(previous => ({
      session,
      achievements: previous.session === session
        ? previous.achievements
        : null,
      loading: true,
      error: false,
    }));

    try {
      const achievements = await profileAchievementsService.getMine(
        token,
        controller.signal,
      );

      if (!isCurrent()) return;

      setState({
        session,
        achievements,
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
  }, [session, enabled, isSessionCurrent, cancel]);

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
    enabled
    && state.session === session
    && isSessionCurrent(session.generation);

  return {
    achievements: visible ? state.achievements : null,
    loading: visible
      ? state.loading
      : enabled && session.userId !== null && session.token !== null,
    error: visible ? state.error : false,
    reload: load,
  };
};
