import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../app/providers/AuthContext';

interface ProfileResourceSession {
  userId: number | null;
  token: string | null;
  generation: number;
}

interface ProfileResourceState<T> {
  session: ProfileResourceSession;
  data: T | null;
  loading: boolean;
  error: boolean;
}

/**
 * Ciclo de lectura de un recurso de Perfil al recibir foco.
 * La identidad incluye usuario, token, generación y enabled: deshabilitar y
 * rehabilitar nunca reutiliza una petición anterior, aunque ignore abort().
 * Cada consumidor conserva su contrato y elegibilidad; null significa que aún
 * no hay dato confirmado (un cero o una lista vacía sí son resultados válidos).
 */
export const useFocusedProfileResource = <T>(
  fetchResource: (token: string, signal: AbortSignal) => Promise<T>,
  enabled = true,
) => {
  const {
    user,
    token,
    isAuthenticated,
    sessionGeneration,
    isSessionCurrent,
  } = useAuth();

  const userId = isAuthenticated ? user?.id_usuario ?? null : null;
  const sessionToken = userId === null ? null : token;
  const session = useMemo<ProfileResourceSession>(() => ({
    userId,
    token: sessionToken,
    generation: sessionGeneration,
  }), [userId, sessionToken, sessionGeneration, enabled]);

  const renderedSessionRef = useRef(session);
  renderedSessionRef.current = session;

  const focusedSessionRef = useRef<ProfileResourceSession | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<ProfileResourceState<T>>({
    session,
    data: null,
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
      data: null,
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
      data: previous.session === session
        ? previous.data
        : null,
      loading: true,
      error: false,
    }));

    try {
      const data = await fetchResource(
        token,
        controller.signal,
      );

      if (!isCurrent()) return;

      setState({
        session,
        data,
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
  }, [session, enabled, isSessionCurrent, cancel, fetchResource]);

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
    data: visible ? state.data : null,
    loading: visible
      ? state.loading
      : enabled && session.userId !== null && session.token !== null,
    error: visible ? state.error : false,
    reload: load,
  };
};
